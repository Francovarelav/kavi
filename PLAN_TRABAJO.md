# Plan de Trabajo - Plataforma Kavi (Actualizado)

## 📋 Resumen Ejecutivo

Desarrollo de una plataforma con dos superficies:

1. Público (sin autenticación): URL abierta con un Agente de Voz que recolecta información dinámica y retorna sugerencias de autos.
2. Admin (con autenticación): Dashboard para cargar autos (Excel/CSV), subir reglas de IA, documentos de conocimiento y revisar sugerencias/actividad del agente.

No existe más "plataforma de vendedor" ni login para usuarios finales.

---

## 🎯 Objetivos del Proyecto

### Público
- Capturar información por voz/texto mediante un agente
- Proveer sugerencias de autos basadas en reglas y datos

### Admin
- Cargar inventario (Excel/CSV)
- Gestionar reglas de IA
- Subir documentos (conocimiento)
- Revisar sugerencias/actividad

---

## 📊 Estado Actual

### ✅ Completado
- Ruteo básico con página pública (`/`)
- Autenticación y dashboard de Admin con sidebar (shadcn dashboard-01)

### ❌ Pendiente
- Agente de voz (frontend y backend)
- Carga/importación de autos y reglas
- Persistencia de sugerencias
- UI de revisión en Admin

---

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── admin-sidebar.tsx   # Sidebar admin
│   ├── user-sidebar.tsx    # (no público, se mantiene base reusable)
│   ├── nav-*.tsx
├── pages/
│   ├── PublicUser.tsx      # Entrada pública (agente de voz)
│   └── admin/
│       ├── AdminLogin.tsx
│       ├── AdminSignup.tsx
│       └── AdminDashboard.tsx
├── contexts/
│   └── AuthContext.tsx     # Solo admins
```

---

## 📅 Roadmap Corto (MVP)

1. Agente de Voz (placeholder → funcional)
   - Captura de audio y transcripción
   - Orquestación de preguntas dinámicas
   - Persistencia de sesiones y respuestas
2. Gestión de Autos (Admin)
   - Esquema y validación de Excel/CSV
   - Importación masiva a Firestore/Storage
3. Reglas de IA (Admin)
   - Modelo de reglas y validación
   - Persistencia y aplicación en runtime
4. Documentos (Admin)
   - Subida y almacenamiento
   - Indexación futura para RAG
5. Sugerencias
   - Generación y almacenamiento
   - Vista de revisión en Admin

---

## 🔧 Colecciones sugeridas (Firestore)
- `users` (solo admins)
- `cars` (inventario)
- `rules` (reglas de IA)
- `documents` (conocimiento)
- `sessions` (sesiones del agente)
- `suggestions` (sugerencias generadas)

---

## ✅ Entregables Inmediatos
- Página pública lista para integrar agente
- Dashboard Admin con secciones placeholder para:
  - Subir Autos
  - Subir Reglas
  - Subir Documentos
  - Revisar Sugerencias

---

Última actualización: ahora
