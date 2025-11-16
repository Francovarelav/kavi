import { useState, useEffect, useRef } from "react";
import { collection, addDoc, doc, updateDoc, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCar, IconX, IconRobot, IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";
import { Orb } from "@/components/ui/orb";
import { useConversation } from "@elevenlabs/react";
import Aurora from "@/components/Aurora";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type Car = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  location: string;
  aisle: number | null;
  photoUrls: string[];
};

export default function KaviExperience({ onExit }: { onExit: () => void }) {
  const { userData } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [recommendedCars, setRecommendedCars] = useState<Car[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    agentId: "agent_5801ka54krfafsja7trt8gxadwk2",
    onConnect: () => {
      console.log("✅ Conectado a ElevenLabs");
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log("❌ Desconectado");
      setIsConnected(false);
    },
    onError: (error) => {
      console.error("❌ Error de ElevenLabs:", error);
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log("Mensaje:", message);
      const msg: ConversationMessage = {
        role: message.source === "user" ? "user" : "assistant",
        content: message.message || "",
        timestamp: new Date().toISOString(),
      };
      
      setConversationMessages(prev => {
        const newMessages = [...prev, msg];
        
        // Guardar en Firestore
        if (sessionId) {
          const sessionRef = doc(db, "sessions", sessionId);
          updateDoc(sessionRef, {
            messages: newMessages,
            lastUpdate: new Date().toISOString(),
          }).catch(err => console.error("Error guardando mensaje:", err));
        }
        
        return newMessages;
      });

      // Analizar TODOS los mensajes para buscar autos
      if (msg.content) {
        analyzeAndRecommend(conversationMessages.map(m => m.content).join(" "));
      }
    },
    onModeChange: (mode) => {
      console.log("Modo:", mode.mode);
    },
  });

  useEffect(() => {
    // NO crear sesión automáticamente, esperar a que el usuario inicie
  }, []);

  useEffect(() => {
    // Auto-scroll al último mensaje
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  const createSession = async () => {
    try {
      const sessionDoc = await addDoc(collection(db, "sessions"), {
        userId: userData?.uid || "anonymous",
        userName: userData?.name || "Usuario",
        startTime: new Date().toISOString(),
        status: "active",
        messages: [], // ✅ Los mensajes se guardan aquí directamente
      });
      setSessionId(sessionDoc.id);
      console.log("Sesión creada:", sessionDoc.id);
    } catch (error) {
      console.error("Error creando sesión:", error);
    }
  };

  const handleStartConversation = async () => {
    try {
      console.log("🎤 Solicitando permisos de micrófono...");
      
      // Crear sesión en Firestore SOLO cuando el usuario inicia
      if (!sessionId) {
        await createSession();
      }
      
      // Solicitar permisos de micrófono explícitamente
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Iniciar sesión de ElevenLabs (el agentId ya está en useConversation)
      // @ts-ignore - El SDK maneja esto internamente
      await conversation.startSession();
      
      console.log("✅ Conversación iniciada");
    } catch (error) {
      console.error("❌ Error iniciando conversación:", error);
      alert("Por favor, permite el acceso al micrófono para continuar.");
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      
      // Actualizar sesión en Firestore
      if (sessionId) {
        const sessionRef = doc(db, "sessions", sessionId);
        await updateDoc(sessionRef, {
          endTime: new Date().toISOString(),
          status: "completed",
          messages: conversationMessages, // ✅ Guardar como "messages" directamente
        });
      }
      
      onExit();
    } catch (error) {
      console.error("Error finalizando conversación:", error);
      onExit();
    }
  };

  const analyzeAndRecommend = async (userInput: string) => {
    try {
      const apiKey = "AIzaSyDnUMpfjOO0H39P0DfkBZRq7pyiLnAql1c";
      const analysisPrompt = `Eres un asistente que extrae criterios de búsqueda de autos.

Conversación del usuario: "${userInput}"

IMPORTANTE: Responde SOLO con un objeto JSON válido, SIN texto adicional, SIN explicaciones, SIN markdown.

Formato EXACTO:
{
  "make": "marca o null",
  "bodyType": "tipo o null",
  "fuel": "combustible o null",
  "transmission": "transmisión o null",
  "maxMileage": número o null,
  "minYear": número o null,
  "maxYear": número o null
}

Ejemplo válido:
{"make":"Toyota","bodyType":"camioneta","fuel":"gasolina","transmission":null,"maxMileage":100000,"minYear":2020,"maxYear":null}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: analysisPrompt }] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              topK: 10,
            }
          }),
        }
      );

      const data = await response.json();
      let criteriaText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      // Limpiar respuesta de Gemini
      criteriaText = criteriaText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^[^{]*/g, "") // Eliminar texto antes del primer {
        .replace(/[^}]*$/g, "") // Eliminar texto después del último }
        .trim();
      
      console.log("📝 Respuesta de Gemini:", criteriaText);
      
      let criteria;
      try {
        criteria = JSON.parse(criteriaText);
      } catch (parseError) {
        console.error("❌ Error parseando JSON de Gemini:", parseError);
        console.log("Texto recibido:", criteriaText);
        // Si falla, usar criterios vacíos
        criteria = {
          make: null,
          bodyType: null,
          fuel: null,
          transmission: null,
          maxMileage: null,
          minYear: null,
          maxYear: null
        };
      }

      console.log("🔍 Criterios extraídos:", criteria);

      // Buscar TODOS los carros (sin límite inicial)
      const carsRef = collection(db, "cars");
      const q = query(carsRef);
      const snapshot = await getDocs(q);
      let allCars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`📊 Total de carros en DB: ${allCars.length}`);

      // Filtrar según criterios (más flexible)
      let filteredCars = allCars.filter((car: any) => {
        let matches = true;
        
        // Marca (flexible: busca coincidencia parcial)
        if (criteria.make) {
          const makeLower = criteria.make.toLowerCase();
          const carMakeLower = car.make?.toLowerCase() || "";
          matches = matches && (
            carMakeLower.includes(makeLower) || 
            makeLower.includes(carMakeLower)
          );
          if (!matches) console.log(`❌ ${car.make} ${car.model} - No coincide marca (buscando: ${criteria.make})`);
        }
        
        // Tipo de carrocería (flexible)
        if (criteria.bodyType && matches) {
          const typeLower = criteria.bodyType.toLowerCase();
          const carTypeLower = car.bodyType?.toLowerCase() || "";
          matches = matches && (
            carTypeLower.includes(typeLower) || 
            typeLower.includes(carTypeLower) ||
            (typeLower.includes("camioneta") && (carTypeLower.includes("pickup") || carTypeLower.includes("suv"))) ||
            (typeLower.includes("pickup") && carTypeLower.includes("camioneta")) ||
            (typeLower.includes("sedan") && carTypeLower.includes("sedán"))
          );
          if (!matches) console.log(`❌ ${car.make} ${car.model} - No coincide tipo (buscando: ${criteria.bodyType}, tiene: ${car.bodyType})`);
        }
        
        // Combustible (flexible)
        if (criteria.fuel && matches) {
          const fuelLower = criteria.fuel.toLowerCase();
          const carFuelLower = car.fuel?.toLowerCase() || "";
          matches = matches && (
            carFuelLower.includes(fuelLower) || 
            fuelLower.includes(carFuelLower)
          );
          if (!matches) console.log(`❌ ${car.make} ${car.model} - No coincide combustible (buscando: ${criteria.fuel}, tiene: ${car.fuel})`);
        }
        
        // Transmisión (flexible)
        if (criteria.transmission && matches) {
          const transLower = criteria.transmission.toLowerCase();
          const carTransLower = car.transmission?.toLowerCase() || "";
          matches = matches && (
            carTransLower.includes(transLower) || 
            transLower.includes(carTransLower) ||
            (transLower.includes("automatico") && carTransLower.includes("automático")) ||
            (transLower.includes("automático") && carTransLower.includes("automatico"))
          );
          if (!matches) console.log(`❌ ${car.make} ${car.model} - No coincide transmisión (buscando: ${criteria.transmission}, tiene: ${car.transmission})`);
        }
        
        // Kilometraje máximo
        if (criteria.maxMileage && matches) {
          matches = matches && (car.mileage <= criteria.maxMileage);
          if (!matches) console.log(`❌ ${car.make} ${car.model} - Kilometraje muy alto (${car.mileage} > ${criteria.maxMileage})`);
        }
        
        // Año mínimo
        if (criteria.minYear && matches) {
          matches = matches && (car.year && car.year >= criteria.minYear);
          if (!matches) console.log(`❌ ${car.make} ${car.model} - Año muy viejo (${car.year} < ${criteria.minYear})`);
        }
        
        // Año máximo
        if (criteria.maxYear && matches) {
          matches = matches && (car.year && car.year <= criteria.maxYear);
          if (!matches) console.log(`❌ ${car.make} ${car.model} - Año muy nuevo (${car.year} > ${criteria.maxYear})`);
        }
        
        if (matches) {
          console.log(`✅ ${car.make} ${car.model} ${car.year} - COINCIDE`);
        }
        
        return matches;
      });

      console.log(`🎯 Carros filtrados: ${filteredCars.length}`);

      // Si no hay resultados con filtros estrictos, usar Gemini para segundo análisis
      if (filteredCars.length === 0 && (criteria.make || criteria.bodyType)) {
        console.log("⚠️ No hay resultados, relajando criterios...");
        filteredCars = allCars.filter((car: any) => {
          // Solo filtrar por marca O tipo (no ambos)
          if (criteria.make) {
            const makeLower = criteria.make.toLowerCase();
            const carMakeLower = car.make?.toLowerCase() || "";
            return carMakeLower.includes(makeLower) || makeLower.includes(carMakeLower);
          }
          if (criteria.bodyType) {
            const typeLower = criteria.bodyType.toLowerCase();
            const carTypeLower = car.bodyType?.toLowerCase() || "";
            return carTypeLower.includes(typeLower) || typeLower.includes(carTypeLower);
          }
          return true;
        });
        console.log(`🔄 Carros con criterios relajados: ${filteredCars.length}`);
      }

      // Si aún no hay resultados, usar Gemini para análisis inteligente
      if (filteredCars.length < 3) {
        console.log("🤖 Usando Gemini para análisis inteligente...");
        
        try {
          // Crear lista de carros disponibles
          const carsDescription = allCars.slice(0, 20).map((car: any) => 
            `${car.make} ${car.model} ${car.year} - ${car.bodyType} - $${car.price} - ${car.fuel} - ${car.mileage}km`
          ).join("\n");

          const smartPrompt = `Eres un experto en recomendación de autos.

Usuario dice: "${userInput}"

Autos disponibles:
${carsDescription}

Analiza la solicitud del usuario y recomienda los 5 mejores autos que coincidan con sus necesidades.
Responde SOLO con un array JSON de índices (0-19) de los autos recomendados, ordenados del mejor al peor.

Ejemplo: [3, 7, 12, 1, 15]`;

          const smartResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: smartPrompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  topP: 0.9,
                  topK: 20,
                }
              }),
            }
          );

          const smartData = await smartResponse.json();
          let smartText = smartData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
          smartText = smartText.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/^[^\[]*/g, "").replace(/[^\]]*$/g, "").trim();
          
          console.log("🤖 Respuesta inteligente de Gemini:", smartText);
          
          try {
            const recommendedIndices = JSON.parse(smartText);
            if (Array.isArray(recommendedIndices) && recommendedIndices.length > 0) {
              filteredCars = recommendedIndices
                .filter(idx => idx >= 0 && idx < allCars.length)
                .map(idx => allCars[idx])
                .filter(Boolean);
              console.log(`✨ Gemini recomendó ${filteredCars.length} autos inteligentemente`);
            }
          } catch (parseError) {
            console.error("Error parseando recomendaciones de Gemini:", parseError);
          }
        } catch (geminiError) {
          console.error("Error en análisis inteligente:", geminiError);
        }
      }

      // Si aún no hay resultados, mostrar los 10 más recientes
      if (filteredCars.length === 0) {
        console.log("⚠️ Sin resultados, mostrando carros recientes...");
        filteredCars = allCars.slice(0, 10);
      }

      // Ordenar por precio (más baratos primero) y tomar top 5
      filteredCars.sort((a: any, b: any) => (a.price || 999999) - (b.price || 999999));
      const topCars = filteredCars.slice(0, 5) as Car[];
      
      console.log("🚗 Top 5 recomendaciones:", topCars.map(c => `${c.make} ${c.model} - $${c.price}`));
      
      setRecommendedCars(topCars);

      // Guardar recomendaciones en Firestore
      if (sessionId && topCars.length > 0) {
        const sessionRef = doc(db, "sessions", sessionId);
        await updateDoc(sessionRef, {
          lastRecommendations: {
            timestamp: new Date().toISOString(),
            criteria,
            cars: topCars,
            carIds: topCars.map(c => c.id),
            count: filteredCars.length,
          }
        });
        
        // Marcar que ya hay recomendaciones
        setHasRecommendations(true);
      }

      console.log(`✅ Recomendaciones guardadas: ${topCars.length} de ${filteredCars.length} encontrados`);
    } catch (error) {
      console.error("Error analizando y recomendando:", error);
    }
  };

  // Si ya se muestran las recomendaciones, renderizar página completa
  if (showRecommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-md border-b border-gray-200 p-6 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <IconCar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tus Recomendaciones</h1>
                <p className="text-sm text-gray-600">{recommendedCars.length} autos perfectos para ti</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowRecommendations(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Volver
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={onExit}
                className="border-gray-300 hover:bg-gray-100"
              >
                <IconX className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de Recomendaciones */}
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedCars.map((car, idx) => (
              <Card key={car.id} className="bg-white border-gray-200 overflow-hidden hover:shadow-2xl hover:border-blue-400 transition-all group">
                {/* Badge de posición */}
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  #{idx + 1}
                </div>

                {/* Imagen con galería */}
                {car.photoUrls && car.photoUrls.length > 0 ? (
                  <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                    <img
                      src={car.photoUrls[0]}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {car.photoUrls.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                        +{car.photoUrls.length - 1} fotos
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <IconCar className="w-20 h-20 text-gray-400" />
                  </div>
                )}

                {/* Info completa */}
                <div className="p-6 space-y-4">
                  {/* Título */}
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{car.make} {car.model}</h3>
                    <p className="text-base text-blue-600 font-semibold mt-1">{car.year}</p>
                  </div>

                  {/* Precio destacado */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 text-sm font-semibold">💰 Precio</span>
                      <span className="text-3xl font-bold text-green-700">${car.price?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pasillo destacado */}
                  {car.aisle && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 text-sm font-semibold">🅿️ Pasillo</span>
                        <span className="text-4xl font-bold text-blue-700">{car.aisle}</span>
                      </div>
                    </div>
                  )}

                  {/* Detalles técnicos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Tipo</p>
                      <p className="text-sm font-bold text-gray-900">{car.bodyType || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Combustible</p>
                      <p className="text-sm font-bold text-gray-900">{car.fuel || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Kilometraje</p>
                      <p className="text-sm font-bold text-gray-900">{car.mileage?.toLocaleString() || "N/A"} km</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Transmisión</p>
                      <p className="text-sm font-bold text-gray-900">{car.transmission || "N/A"}</p>
                    </div>
                  </div>

                  {/* Ubicación */}
                  {car.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 border-t border-gray-200 pt-4">
                      <span className="text-lg">📍</span>
                      <span className="truncate font-medium">{car.location}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {recommendedCars.length === 0 && (
            <div className="text-center py-16">
              <IconCar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No se encontraron recomendaciones</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden relative">
      {/* Aurora Background con poca opacidad */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Aurora />
      </div>

      {/* Header minimalista */}
      <div className="bg-black/60 backdrop-blur-md border-b border-white/10 p-3 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white">Kavi</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndConversation}
            className="text-white hover:bg-white/10 h-8 w-8 p-0"
          >
            <IconX className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Centrado y minimalista */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative z-10">
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          
          {/* Orb Component */}
          <div className="relative">
            <Orb />
          </div>

          {/* Estado */}
          {isConnected && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Conectado</span>
            </div>
          )}

          {/* Controles en columna */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {!isConnected && (
              <div className="text-center mb-2">
                <p className="text-sm text-gray-400">
                  Haz click en "Comenzar" y permite el acceso al micrófono
                </p>
              </div>
            )}
            <Button
              onClick={isConnected ? handleEndConversation : handleStartConversation}
              className={`w-full px-6 py-3 text-sm rounded-full ${
                isConnected 
                  ? "border-white/20 text-white hover:bg-white/10 border" 
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {isConnected ? (
                <>
                  <IconMicrophoneOff className="w-4 h-4 mr-2" />
                  Terminar
                </>
              ) : (
                <>
                  <IconMicrophone className="w-4 h-4 mr-2" />
                  Comenzar
                </>
              )}
            </Button>
            
            {/* Botón Ver Recomendaciones - SIEMPRE VISIBLE */}
            <Button
              onClick={() => setShowRecommendations(true)}
              className={`w-full px-6 py-3 text-sm rounded-full ${
                hasRecommendations 
                  ? "bg-blue-600 text-white hover:bg-blue-700 animate-pulse" 
                  : "bg-white/10 text-gray-400 hover:bg-white/20 border border-white/20"
              }`}
              disabled={!hasRecommendations && recommendedCars.length === 0}
            >
              <IconCar className="w-4 h-4 mr-2" />
              {recommendedCars.length > 0 
                ? `Ver Recomendaciones (${recommendedCars.length})` 
                : "Preparando recomendaciones..."}
            </Button>
          </div>

          {/* Mensaje de preparando recomendaciones */}
          {isConnected && !hasRecommendations && conversationMessages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Analizando tu conversación...</span>
            </div>
          )}

          {/* Chat minimalista */}
          {conversationMessages.length > 0 && (
            <Card className="w-full max-w-2xl bg-white/5 backdrop-blur-md border-white/10 p-3 max-h-[1000px] overflow-hidden">
              <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <IconRobot className="w-3.5 h-3.5" />
                Conversación
              </h3>
              
              <div className="overflow-y-auto max-h-[350px] space-y-2 pr-1">
                {conversationMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-gray-200"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

