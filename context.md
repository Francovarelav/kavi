# Contexto del Proyecto (Actualizado)

## Visión
- Usuarios finales: Acceden a una URL pública, sin inicio de sesión. Interactuarán con un agente de voz (cuestionario dinámico) que recolecta información y devuelve sugerencias de autos.
- Administradores: Único rol autenticado. Administran el inventario, reglas de IA, documentos y revisan sugerencias/actividades.

## Módulos
- Público (sin auth):
  - Página pública con placeholder para Agente de Voz (implementación posterior): `src/pages/PublicUser.tsx`.
- Admin (con auth Firebase):
  - Login y Registro de admin
  - Dashboard admin (`/admin/dashboard`) con Sidebar (shadcn dashboard-01)
  - Secciones (esqueleto inicial):
    - Subir Carros (carga por Excel/CSV más adelante)
    - Subir Reglas de IA
    - Subir Documentos (conocimiento)
    - Sugerencias/Actividades del agente

## Autenticación
- Solo admins. Los usuarios no requieren cuenta.
- `AuthContext` se mantiene, y el dashboard requiere `role === 'admin'`.

## Rutas
- `/` → Público (Agente de voz, sin auth)
- `/admin/login` → Login admin
- `/admin/signup` → Signup admin
- `/admin/dashboard` → Dashboard protegido admin

## Próximos pasos (alto nivel)
1. Implementar Agente de Voz (captura de audio, orquestación de prompts, pipeline de preguntas dinámicas).
2. Diseñar esquema de datos de autos (headers de Excel) y parsers.
3. UI para subir archivos (cars.xlsx/csv), reglas y documentos.
4. Persistencia (Firestore/Storage) y reglas de acceso.
5. Vista de sugerencias generadas y auditoría.
