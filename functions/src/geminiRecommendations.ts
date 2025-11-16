import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const GEMINI_API_KEY = "AIzaSyDnUMpfjOO0H39P0DfkBZRq7pyiLnAql1c";

export const analyzeUserRequest = onCall(async (request) => {
  const { userInput } = request.data;

  if (!userInput) {
    throw new Error("userInput es requerido");
  }

  try {
    // Analizar con Gemini
    const analysisPrompt = `Analiza esta solicitud de un cliente de autos y extrae SOLO los criterios de búsqueda en formato JSON.
Solicitud: "${userInput}"

Responde ÚNICAMENTE con un objeto JSON válido con estos campos (deja en null lo que no se mencione):
{
  "make": "marca del auto o null",
  "bodyType": "tipo de carrocería (sedán, suv, pickup, etc) o null",
  "fuel": "tipo de combustible (gasolina, eléctrico, híbrido) o null",
  "transmission": "transmisión (manual, automático, estándar) o null",
  "maxMileage": número máximo de kilometraje o null,
  "minYear": año mínimo o null,
  "maxYear": año máximo o null
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
        }),
      }
    );

    const data = await response.json();
    let criteriaText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Limpiar markdown
    criteriaText = criteriaText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const criteria = JSON.parse(criteriaText);

    // Buscar en Firestore
    const db = getFirestore();
    const carsRef = db.collection("cars");
    const snapshot = await carsRef.orderBy("createdAt", "desc").limit(50).get();

    let cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filtrar según criterios
    cars = cars.filter((car: any) => {
      if (criteria.make && !car.make?.toLowerCase().includes(criteria.make.toLowerCase())) return false;
      if (criteria.bodyType && !car.bodyType?.toLowerCase().includes(criteria.bodyType.toLowerCase())) return false;
      if (criteria.fuel && !car.fuel?.toLowerCase().includes(criteria.fuel.toLowerCase())) return false;
      if (criteria.transmission && !car.transmission?.toLowerCase().includes(criteria.transmission.toLowerCase())) return false;
      if (criteria.maxMileage && car.mileage > criteria.maxMileage) return false;
      if (criteria.minYear && car.year && car.year < criteria.minYear) return false;
      if (criteria.maxYear && car.year && car.year > criteria.maxYear) return false;
      return true;
    });

    return {
      criteria,
      recommendations: cars.slice(0, 5),
      totalFound: cars.length,
    };
  } catch (error: any) {
    console.error("Error en analyzeUserRequest:", error);
    throw new Error(`Error procesando solicitud: ${error.message}`);
  }
});

