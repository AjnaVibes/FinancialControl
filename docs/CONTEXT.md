# 🚀 CONTEXTO RÁPIDO PARA CLAUDE - FINANCIAL CONTROL

**COPIA ESTO AL INICIO DE CADA CHAT NUEVO**

---

## 📋 INFORMACIÓN DEL PROYECTO

Hola Claude, continuamos con el proyecto **FinancialControl**.

### Descripción
Sistema de Control Financiero Inmobiliario para gestionar ventas, pagarés, cobranza y KPIs de dirección general.

### Stack Tecnológico
- **Frontend/Backend:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **ORM:** Prisma
- **Base de Datos:** MySQL
- **Auth:** NextAuth (Gmail)
- **UI:** Tailwind CSS + shadcn/ui
- **Gráficas:** Recharts
- **Estado:** React Query

### Ubicaciones
- **Repo:** https://github.com/AjnaVibes/FinancialControl
- **Local:** C:\Dev\FinancialControl
- **Deploy Staging:** [PENDIENTE]
- **Deploy Prod:** [PENDIENTE]

---

## 🎯 OBJETIVO V1

**Fecha de lanzamiento:** 15 Noviembre 2025 (14 días)

**Alcance:**
- ✅ Sistema de Pagarés completo
- ✅ Dashboard Dirección General
- ✅ Multiempresa funcional
- ✅ Roles y permisos
- ✅ Tareas/comentarios básico
- ✅ Desplegado en producción

**NO incluye V1:**
- ❌ Master de Proyecto
- ❌ Sistema de documentos
- ❌ Notificaciones tiempo real

---

## 📂 ESTRUCTURA DEL PROYECTO

```
C:\Dev\FinancialControl\
+---prisma
|   |   schema.prisma
|   |   seed.ts
|   |   
|   \---migrations
|       |   migration_lock.toml
|       |   
|       +---20251012042126_init
|       |       migration.sql
|       |       
|       +---20251012180454_add_clients_table
|       |       migration.sql
|       |       
|       +---20251012181009_add_sync_tables
|       |       migration.sql
|       |       
|       +---20251013023934_add_multicompany_system
|       |       migration.sql
|       |       
|       \---20251022160629_add_ramp_tables
|               migration.sql
|               
+---scripts
|       check-counts.ts
|       check-errors.ts
|       check-schema-types.ts
|       diagnose-sync.ts
|       init-all-tables.ts
|       init-clients.ts
|       init-companies.ts
|       init-webhook-configs.ts
|       resync-errors.ts
|       resync-failed.ts
|       show-sync-errors.ts
|       sync-status-real.ts
|       
\---src
    |   middleware.ts
    |   
    +---app
    |   |   globals.css
    |   |   layout.tsx
    |   |   page.tsx
    |   |   providers.tsx
    |   |   
    |   +---(auth)
    |   |   \---login
    |   |           page.tsx
    |   |           
    |   +---(dashboard)
    |   |   \---dashboard
    |   |       |   layout.tsx
    |   |       |   page.tsx
    |   |       |   page.tsx.backup
    |   |       |   
    |   |       +---pagares
    |   |       |       page.tsx
    |   |       |       
    |   |       \---sync
    |   |               page.tsx
    |   |               page.tsx.backup
    |   |               
    |   \---api
    |       +---analytics
    |       |   \---kpis
    |       |           route.ts
    |       |           
    |       +---auth
    |       |           route.ts
    |       |           
    |       +---make
    |       |   \---ramp
    |       |           route.ts
    |       |           
    |       +---promissories
    |       |   |   route.ts
    |       |   |   
    |       |   +---projects
    |       |   |       route.ts
    |       |   |       
    |       |   \---stats
    |       |           route.ts
    |       |           
    |       \---sync
    |           +---clients
    |           |       route.ts
    |           |       
    |           +---direct
    |           |   \---test
    |           |           route.ts
    |           |           
    |           +---status
    |           |       route.ts
    |           |       
    |           +---trigger
    |           |       route.ts
    |           |       
    |           \---[table]
    |                   route.ts
    |                   
    +---components
    |   |   Header.tsx
    |   |   
    |   +---atoms
    |   |   +---Badge
    |   |   |       index.ts
    |   |   |       NotificationBadge.tsx
    |   |   |       
    |   |   +---Button
    |   |   |       Button.tsx
    |   |   |       Button.types.ts
    |   |   |       index.ts
    |   |   |       
    |   |   +---Divider
    |   |   |       Divider.tsx
    |   |   |       index.ts
    |   |   |       
    |   |   +---IconButton
    |   |   |       IconButton.tsx
    |   |   |       index.ts
    |   |   |       
    |   |   \---Logo
    |   |           index.ts
    |   |           Logo.tsx
    |   |           
    |   +---molecules
    |   |   +---CompanySelector
    |   |   |       CompanySelector.tsx
    |   |   |       index.ts
    |   |   |       
    |   |   +---DarkModeToggle
    |   |   |       DarkModeToggle.tsx
    |   |   |       index.ts
    |   |   |       
    |   |   +---NotificationMenu
    |   |   |       index.ts
    |   |   |       NotificationMenu.tsx
    |   |   |       
    |   |   +---StatCard
    |   |   |       index.ts
    |   |   |       StatCard.ts
    |   |   |       StatCard.tsx
    |   |   |       StatCard.types.ts
    |   |   |       
    |   |   \---UserMenu
    |   |           index.ts
    |   |           UserMenu.tsx
    |   |           
    |   +---organisms
    |   |   +---Breadcrumbs
    |   |   |       Breadcrumbs.tsx
    |   |   |       index.ts
    |   |   |       
    |   |   +---DataTable
    |   |   |       DataTable.tsx
    |   |   |       DataTable.types.ts
    |   |   |       
    |   |   +---Header
    |   |   |       Header.tsx
    |   |   |       index.ts
    |   |   |       
    |   |   +---Sidebar
    |   |   |       index.ts
    |   |   |       Sidebar.tsx
    |   |   |       
    |   |   +---SyncControl
    |   |   |       SyncControl.tsx
    |   |   |       
    |   |   \---SyncStatusCard
    |   |           index.ts
    |   |           SyncStatusCard.tsx
    |   |           
    |   +---templates
    |   |   \---DashboardTemplate
    |   |           DashboardTemplate.tsx
    |   |           
    |   \---ui
    |           button.tsx
    |           card.tsx
    |           
    +---config
    |       sync-tables.config.ts
    |       
    +---lib
    |   |   auth.ts
    |   |   prisma.ts
    |   |   utils.ts
    |   |   ventasDb.ts
    |   |   
    |   +---analytics
    |   |       kpiQueries.ts
    |   |       
    |   \---queries
    |           promissoryQueries.ts
    |           
    +---services
    |   \---sync
    |           directSyncService.backup.ts
    |           directSyncService.backup2.ts
    |           directSyncService.ts
    |           syncOrchestrator.ts
    |           
    \---types
            clients.types.ts
            next-auth.d.ts
            sync.types.ts
            


## 🔑 CONCEPTOS CLAVE

### Multiempresa
- Campo `company_id` en tablas principales
- Usuario pertenece a 1 empresa
- Filtros automáticos por empresa en queries
- [DETALLES ESPECÍFICOS: POR DEFINIR]

### Sincronización RAMP
- BD remota RAMP (AWS) → BD local
- Sistema genérico configurable
- 30+ tablas sincronizadas
- 4,200+ registros
- Manejo de dependencias automático
- Scripts CLI interactivos

### Roles del Sistema
1. **admin** - Acceso total, gestiona usuarios
2. **gerente** - Ve todo, crea tareas, no edita config
3. **vendedor** - Ve solo sus ventas y clientes
4. **cobranza** - Acceso a pagarés y cobranza
5. **contador** - Reportes financieros, sin edición

### Convenciones
- **Nomenclatura BD:** camelCase (NO snake_case)
  - Correcto: `projectId`, `createdAt`, `fisicalPerson`
  - Incorrecto: `project_id`, `created_at`, `fisical_person`
- **Route Groups:** `(dashboard)` para rutas internas
- **Permisos:** Middleware en cada ruta protegida
- **Commits:** Descriptivos con contexto y link a chat

---

## 📊 ESTADO ACTUAL

**Progreso General:** [VER PROGRESS.MD - actualizado diariamente]

**Última actualización:** [FECHA]

**Working on:** [TAREA ACTUAL]

**Blocker actual:** [BLOCKER O "Ninguno"]

---

## 🐛 BUGS CONOCIDOS CRÍTICOS

### 1. Campo `quotation` en tabla `references`
```
Error: Expected Int or Null, provided DateTime
Ubicación: directSyncService.ts línea 167
Status: [ESTADO ACTUAL]
```

### 2. Multiempresa
```
Descripción: [POR DEFINIR]
Status: [ESTADO ACTUAL]
```

---

## 📝 ARCHIVOS IMPORTANTES QUE DEBES CONOCER

### Schema de Base de Datos
```typescript
// prisma/schema.prisma
// 30+ modelos incluyendo:
// - User, UserType
// - Client, Project, Developer
// - Transaction, PromissoryNote, Payment
// - Unit, Agency, Operate
// [VER SCHEMA COMPLETO EN REPO]
```

### Servicio de Sincronización
```typescript
// src/services/sync/directSyncService.ts
// Maneja sync genérico de cualquier tabla
// Convierte tipos: BigInt→String, tinyint→Boolean
```

### Queries de Pagarés
```typescript
// src/services/promissoryQueries.ts
// Query SQL complejo con CTEs
// Une: promissories + transactions + clients + projects + units
```

---

## 🔗 CHATS ANTERIORES RELEVANTES

**Chat Principal (Coordinación):**
- Link: [GUARDAR AQUÍ]
- Temas: Planning, arquitectura, decisiones

**Chat de Pagarés:**
- Link: [GUARDAR AQUÍ]
- Temas: Queries SQL, tabla, filtros

**Chat de Dashboard:**
- Link: [GUARDAR AQUÍ]
- Temas: KPIs, gráficas, métricas

**Chat de Deploy:**
- Link: [GUARDAR AQUÍ]
- Temas: Vercel, BD producción

---

## 💡 TIPS PARA TRABAJAR CONMIGO

### Para código rápido:
"Genera el componente completo para [funcionalidad] con TypeScript y shadcn/ui"

### Para debugging:
"Tengo este error: [error]. Contexto: [descripción]. Ver archivo: [ruta]"

### Para arquitectura:
"Necesito diseñar [feature]. Consideraciones: [lista]. ¿Cuál es el mejor approach?"

### Para SQL:
"Necesito query que una [tablas] y calcule [métricas]. Debe filtrar por [condiciones]"

---

## 📋 CHECKLIST ANTES DE EMPEZAR

Cuando empieces un nuevo chat, verifica:

- [ ] ¿Leíste PROGRESS.md para ver el estado actual?
- [ ] ¿Sabes en qué día del sprint estamos?
- [ ] ¿Identificaste si hay blockers activos?
- [ ] ¿Tienes claro qué archivos necesitas ver?
- [ ] ¿Guardaste el link de este chat en PROGRESS.md?

---

## 🎯 TAREA DE HOY

[DESCRIBE AQUÍ QUÉ NECESITAS TRABAJAR HOY]

**Archivos que necesito que veas:**
- [LISTA DE ARCHIVOS]

**Contexto adicional:**
[CUALQUIER INFORMACIÓN EXTRA RELEVANTE]

---

## ✅ CONFIRMACIÓN

¿Listo para continuar? Confirma que:
1. Entiendes el contexto del proyecto
2. Sabes en qué estamos trabajando
3. Tienes clara la tarea de hoy

**¡Empecemos!** 🚀

---

**NOTA:** Este archivo es un TEMPLATE. Cópialo al inicio de cada chat nuevo y actualiza las secciones marcadas con [PENDIENTE] o [POR DEFINIR].