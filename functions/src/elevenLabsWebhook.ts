import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const GEMINI_API_KEY = "AIzaSyDnUMpfjOO0H39P0DfkBZRq7pyiLnAql1c";

export const searchCars = onRequest(
  { cors: true, maxInstances: 10 },
  async (request, response) => {
    try {
      const { userInput, sessionId } = request.body;

      if (!userInput) {
        response.status(400).json({ error: "userInput es requerido" });
        return;
      }

      console.log("Buscando autos para:", userInput);

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

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: analysisPrompt }] }],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      let criteriaText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      criteriaText = criteriaText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const criteria = JSON.parse(criteriaText);

      console.log("Criterios extraídos:", criteria);

      // Buscar en Firestore
      const db = getFirestore();
      const carsRef = db.collection("cars");
      const snapshot = await carsRef.orderBy("createdAt", "desc").limit(50).get();

      let cars = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Filtrar según criterios
      cars = cars.filter((car: any) => {
        if (
          criteria.make &&
          !car.make?.toLowerCase().includes(criteria.make.toLowerCase())
        )
          return false;
        if (
          criteria.bodyType &&
          !car.bodyType?.toLowerCase().includes(criteria.bodyType.toLowerCase())
        )
          return false;
        if (
          criteria.fuel &&
          !car.fuel?.toLowerCase().includes(criteria.fuel.toLowerCase())
        )
          return false;
        if (
          criteria.transmission &&
          !car.transmission
            ?.toLowerCase()
            .includes(criteria.transmission.toLowerCase())
        )
          return false;
        if (criteria.maxMileage && car.mileage > criteria.maxMileage)
          return false;
        if (criteria.minYear && car.year && car.year < criteria.minYear)
          return false;
        if (criteria.maxYear && car.year && car.year > criteria.maxYear)
          return false;
        return true;
      });

      const topCars = cars.slice(0, 5);

      // Guardar en sesión si se proporciona sessionId
      if (sessionId) {
        const sessionRef = db.collection("sessions").doc(sessionId);
        await sessionRef.update({
          lastRecommendations: {
            timestamp: new Date().toISOString(),
            criteria,
            cars: topCars,
            carIds: topCars.map((c: any) => c.id),
            count: cars.length,
          },
        });
      }

      console.log(`Encontrados ${cars.length} autos, devolviendo top 5`);

      // Formatear respuesta para ElevenLabs
      const carsList = topCars
        .map(
          (car: any, idx: number) =>
            `${idx + 1}. ${car.make} ${car.model} ${car.year || ""} - ${car.mileage.toLocaleString()} km, ${car.fuel}, ${car.transmission}${car.location ? `, ubicado en ${car.location}` : ""}`
        )
        .join("\n");

      const responseText =
        topCars.length > 0
          ? `Perfecto, encontré ${topCars.length} opciones excelentes para ti:\n\n${carsList}\n\n¿Te gustaría saber más detalles de alguno?`
          : "No encontré autos que coincidan exactamente con tus criterios, pero déjame buscar opciones similares. ¿Podrías darme más detalles o ser más flexible en algún criterio?";

      response.json({
        success: true,
        message: responseText,
        cars: topCars,
        totalFound: cars.length,
        criteria,
      });
    } catch (error: any) {
      console.error("Error en searchCars:", error);
      response.status(500).json({
        error: "Error procesando la búsqueda",
        details: error.message,
      });
    }
  }
);

