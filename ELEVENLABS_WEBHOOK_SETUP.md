# Configuración del Webhook de ElevenLabs para Kavi

## 1. Deploy de la Cloud Function

Primero, despliega la función `searchCars` en Firebase:

```bash
cd functions
npm run build
firebase deploy --only functions:searchCars
```

Esto te dará una URL como:
```
https://us-central1-kaviai.cloudfunctions.net/searchCars
```

---

## 2. Configurar el Tool en ElevenLabs

### Paso 1: Ir a tu Agente
1. Ve a https://elevenlabs.io/app/agents
2. Selecciona tu agente `KAVI AI` (agent_5801ka54krfafsja7trt8gxadwk2)
3. Ve a la pestaña **"Tools"**

### Paso 2: Agregar Webhook Tool
1. Click en **"Add tool"**
2. Selecciona **"Webhook"**

### Paso 3: Configurar el Webhook

**Name:**
```
searchCars
```

**Description:**
```
Busca autos en la base de datos según los criterios del cliente. Usa esta herramienta cuando el cliente te dé información sobre qué tipo de auto busca (edad, propósito, presupuesto, preferencias).
```

**Method:**
```
POST
```

**URL:**
```
https://us-central1-kaviai.cloudfunctions.net/searchCars
```

**Response timeout (seconds):**
```
20
```

**Disable interruptions:**
```
☑️ (Checked)
```

**Pre-tool speech:**
```
Auto
```

### Paso 4: Configurar el Body (JSON)

Click en **"Edit as JSON"** y pega esto:

```json
{
  "userInput": "{{conversation_history}}",
  "sessionId": "{{conversation_id}}"
}
```

**Explicación:**
- `{{conversation_history}}`: ElevenLabs envía automáticamente el historial de la conversación
- `{{conversation_id}}`: ID único de la conversación para guardar en Firestore

---

## 3. Configurar el Prompt del Agente

Ve a la pestaña **"Agent"** y actualiza el System Prompt para incluir instrucciones sobre cuándo usar el tool:

```
Eres Kavi, un asistente de ventas de autos profesional y amigable de Kavak.

FLUJO DE CONVERSACIÓN:
1. Saludo inicial y solicita toda la información del cliente en UN mensaje
2. Confirma que entendiste correctamente
3. **USA EL TOOL searchCars** para buscar autos en la base de datos
4. Presenta las recomendaciones que el tool te devuelva
5. Responde preguntas adicionales

INFORMACIÓN QUE NECESITAS:
- Edad del cliente
- Para qué necesita el auto
- Presupuesto aproximado
- Si busca financiamiento
- Preferencias (marca, tipo, combustible, etc.)

CUÁNDO USAR EL TOOL:
- Después de confirmar la información del cliente
- Cuando tengas suficientes criterios de búsqueda
- El tool buscará en la base de datos y te devolverá hasta 5 opciones

IMPORTANTE:
- Pide TODA la información en un solo mensaje
- Confirma antes de buscar
- Usa el tool searchCars para obtener recomendaciones reales
- Presenta los resultados del tool de forma amigable
- Si el tool no encuentra nada, sugiere ser más flexible en los criterios

TONO:
- Profesional pero cercano
- Entusiasta sobre los autos
- Claro y directo
```

---

## 4. Probar el Webhook

### Prueba Manual:
Puedes probar el webhook directamente con curl:

```bash
curl -X POST https://us-central1-kaviai.cloudfunctions.net/searchCars \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Tengo 28 años, necesito un auto para trabajo, presupuesto 200 mil pesos, busco financiamiento, me interesan sedanes",
    "sessionId": "test-session-123"
  }'
```

Deberías recibir una respuesta como:

```json
{
  "success": true,
  "message": "Perfecto, encontré 5 opciones excelentes para ti:\n\n1. Toyota Corolla 2020 - 45,000 km, Gasolina, Automático\n2. Honda Civic 2019 - 52,000 km, Gasolina, Automático\n...",
  "cars": [...],
  "totalFound": 15,
  "criteria": {...}
}
```

---

## 5. Flujo Completo

```
Usuario: "Hola, tengo 28 años, necesito un auto para trabajo..."
   ↓
Kavi: "Perfecto, déjame confirmar..."
   ↓
Usuario: "Sí, correcto"
   ↓
Kavi llama al tool searchCars
   ↓
Cloud Function:
  - Analiza con Gemini
  - Busca en Firestore
  - Filtra según criterios
  - Devuelve top 5 autos
   ↓
Kavi: "Excelente, encontré 5 opciones perfectas..."
   ↓
Frontend muestra los autos visualmente
```

---

## 6. Datos que se Guardan en Firestore

### Collection: `sessions`

```javascript
{
  userId: "uid o anonymous",
  userName: "Nombre",
  startTime: "2024-11-16T...",
  status: "active",
  messages: [
    { role: "user", content: "...", timestamp: "..." },
    { role: "assistant", content: "...", timestamp: "..." }
  ],
  lastRecommendations: {
    timestamp: "...",
    criteria: {
      make: "Toyota",
      bodyType: "sedan",
      fuel: "gasolina",
      ...
    },
    cars: [
      {
        id: "car123",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        mileage: 45000,
        ...
      }
    ],
    carIds: ["car123", "car456"],
    count: 5
  }
}
```

---

## 7. Variables de ElevenLabs Disponibles

Puedes usar estas variables en el body del webhook:

- `{{conversation_id}}` - ID único de la conversación
- `{{conversation_history}}` - Historial completo de mensajes
- `{{user_message}}` - Último mensaje del usuario
- `{{agent_message}}` - Último mensaje del agente

---

## 8. Troubleshooting

### El tool no se llama:
- Verifica que el prompt mencione explícitamente cuándo usar el tool
- Asegúrate de que la descripción del tool sea clara
- Prueba diciendo explícitamente "busca autos para mí"

### Error 500:
- Verifica los logs en Firebase Console
- Asegúrate de que Gemini API key sea válida
- Verifica que la collection `cars` exista en Firestore

### No devuelve autos:
- Verifica que haya autos en Firestore
- Revisa los criterios extraídos por Gemini en los logs
- Prueba con criterios más amplios

---

## 9. Monitoreo

### Ver logs de la función:
```bash
firebase functions:log --only searchCars
```

### Ver en Firebase Console:
1. Ve a Firebase Console
2. Functions → searchCars
3. Pestaña "Logs"

---

## 10. Próximos Pasos

1. ✅ Deploy de la función
2. ✅ Configurar tool en ElevenLabs
3. ✅ Actualizar prompt del agente
4. ✅ Probar con conversación real
5. ✅ Verificar que se guarden los datos en Firestore
6. ✅ Ajustar prompt según resultados

---

## Notas Importantes

- El webhook tiene un timeout de 20 segundos
- Gemini puede tardar 2-5 segundos en analizar
- La búsqueda en Firestore es rápida (<1 segundo)
- Total: ~5-8 segundos de respuesta

- **CORS está habilitado** en la función
- **No requiere autenticación** (puedes agregar validación si quieres)
- **Guarda automáticamente** en Firestore si se proporciona sessionId

¡Listo para usar! 🚀

