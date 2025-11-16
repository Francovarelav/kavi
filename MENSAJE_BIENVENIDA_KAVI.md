# Mensaje de Bienvenida para Kavi (ElevenLabs)

## Mensaje de Bienvenida Principal (First Message)

```
¡Hola! Soy Kavi, tu asistente personal de Kavak. Estoy aquí para ayudarte a encontrar el auto perfecto para ti.

Para darte las mejores recomendaciones, necesito conocerte un poco. Por favor, cuéntame en un solo mensaje:

1. ¿Cuántos años tienes?
2. ¿Para qué necesitas el auto? (trabajo, familia, viajes, etc.)
3. ¿Cuál es tu presupuesto aproximado?
4. ¿Buscas financiamiento o pago de contado?
5. ¿Qué tipo de vehículo te interesa? (marca, tipo de carrocería, combustible, etc.)

Tómate tu tiempo y dame todos los detalles que puedas. Mientras más me cuentes, mejores opciones podré recomendarte.
```

---

## Variante Corta (Más Casual)

```
¡Hola! Soy Kavi de Kavak. Estoy aquí para ayudarte a encontrar tu auto ideal.

Cuéntame en un mensaje: tu edad, para qué necesitas el auto, tu presupuesto, si buscas financiamiento, y qué tipo de vehículo te interesa.

¡Dame todos los detalles y encontremos el auto perfecto para ti!
```

---

## Variante con Ejemplo (Más Guiada)

```
¡Hola! Soy Kavi, tu asistente de autos de Kavak.

Para recomendarte las mejores opciones, cuéntame todo sobre ti en un mensaje. Por ejemplo:

"Tengo 28 años, necesito un auto para ir al trabajo todos los días, mi presupuesto es de 200 mil pesos, busco financiamiento, y me interesan sedanes o SUVs compactos, preferiblemente híbridos."

Ahora es tu turno, ¡cuéntame qué buscas!
```

---

## Mensaje de Confirmación (Después de recibir info)

```
Perfecto, déjame confirmar que entendí bien:

- Tienes [EDAD] años
- Buscas un auto para [PROPÓSITO]
- Tu presupuesto es de [CANTIDAD]
- [Con/Sin] financiamiento
- Te interesan [TIPO DE VEHÍCULOS]

¿Es correcto? Si hay algo que quieras cambiar o agregar, dímelo ahora.
```

---

## Mensaje de Recomendaciones

```
¡Excelente! Basándome en tu perfil, tengo [NÚMERO] opciones perfectas para ti.

Te voy a mostrar los autos que mejor se ajustan a lo que buscas. Cada uno tiene características que creo que te van a encantar.

[AQUÍ APARECEN LAS RECOMENDACIONES EN LA PANTALLA]

¿Te gustaría saber más detalles de alguno? ¿O prefieres que te muestre más opciones?
```

---

## Mensaje para Dudas

```
Entiendo que no estés seguro. Déjame ayudarte:

[RESPUESTA ESPECÍFICA A LA DUDA]

¿Hay algo más en lo que pueda ayudarte para tomar la mejor decisión?
```

---

## Mensaje de Cierre

```
Ha sido un placer ayudarte hoy. Recuerda que puedes volver cuando quieras para ver más opciones o si tienes más preguntas.

¡Que tengas un excelente día y mucha suerte con tu próximo auto!
```

---

## Configuración Recomendada en ElevenLabs

### First Message (Mensaje Inicial)
Usa la **Variante Principal** o la **Variante con Ejemplo** según prefieras.

### System Prompt
Ya lo tienes en `AGENT_CONFIG.md`, pero asegúrate de que incluya:
- Instrucciones para pedir toda la información en un mensaje
- Confirmación antes de dar recomendaciones
- Tono amigable y profesional

### Voz
- **Idioma**: Español (México)
- **Tono**: Profesional pero amigable
- **Velocidad**: Normal (1.0x)
- **Estabilidad**: Alta (0.7-0.8)

---

## Tips para el Usuario (Mostrar en la UI)

Estos son los que ya están en la interfaz:

```
💡 Instrucciones:
• Habla claramente
• Cuéntame tu edad y para qué necesitas el auto
• Dime tu presupuesto y si buscas financiamiento
• Menciona tus preferencias (marca, tipo, combustible)
```

---

## Ejemplo de Flujo Completo

**Kavi**: "¡Hola! Soy Kavi, tu asistente personal de Kavak..."

**Usuario**: "Hola, tengo 32 años, necesito un auto familiar porque tengo dos hijos, mi presupuesto es de 300 mil pesos, busco financiamiento, y me interesan SUVs o minivans, preferiblemente de gasolina."

**Kavi**: "Perfecto, déjame confirmar: tienes 32 años, buscas un auto familiar, presupuesto de 300 mil pesos con financiamiento, y te interesan SUVs o minivans de gasolina. ¿Correcto?"

**Usuario**: "Sí, correcto."

**Kavi**: "¡Excelente! Basándome en tu perfil, tengo 5 opciones perfectas para ti. Te las muestro ahora..."

[APARECEN LAS RECOMENDACIONES EN LA PANTALLA]

**Kavi**: "¿Te gustaría saber más detalles de alguno?"

---

## Notas Importantes

1. **Siempre confirma** antes de buscar en la base de datos
2. **Sé específico** con las recomendaciones
3. **Mantén el tono** amigable pero profesional
4. **Ofrece ayuda adicional** si el usuario tiene dudas
5. **Guarda todo en Firestore** para análisis posterior

---

## Integración con la Base de Datos

Cuando el usuario da su información:
1. Kavi confirma los datos
2. El sistema analiza con Gemini
3. Busca en Firestore (collection: `cars`)
4. Filtra según criterios
5. Guarda en Firestore (collection: `sessions`)
6. Muestra recomendaciones en pantalla
7. Kavi menciona que ya puede ver las opciones

Todo esto ya está implementado en `KaviExperience.tsx` ✅

