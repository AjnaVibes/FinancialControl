# 🏗️ ARQUITECTURA - FINANCIAL CONTROL

**Última actualización:** 28 Octubre 2025

---

## 📐 DECISIONES ARQUITECTÓNICAS CLAVE

### 1. Stack Tecnológico

#### Frontend
- **Framework:** Next.js 14 (App Router)
- **Motivo:** SSR, file-based routing, API routes integradas
- **Beneficios:** Performance, SEO, developer experience

#### Backend
- **Approach:** Full-stack con Next.js API Routes
- **Motivo:** Menos complejidad, deploy unificado
- **Alternativas consideradas:** Separar backend en Express/Fastify (rechazado por overhead)

#### Base de Datos
- **ORM:** Prisma
- **Motivo:** Type-safety, migrations, developer experience
- **Base de Datos:** MySQL
- **Motivo:** Compatibilidad con sistemas legacy (RAMP, VS Control)

#### Autenticación
- **Solución:** NextAuth.js
- **Provider:** Google OAuth (Gmail)
- **Session:** JWT
- **Motivo:** Seguridad, fácil integración, SSO corporativo

---

## 🗂️ ESTRUCTURA DEL PROYECTO

### Atomic Design Pattern

Seguimos Atomic Design para componentes reutilizables:

```
components/
├── atoms/           # Componentes básicos (Button, Input, Badge)
├── molecules/       # Composición de atoms (SearchBar, StatCard)
└── organisms/       # Componentes complejos (DataTable, Dashboard)
```

**Beneficios:**
- Reutilización máxima
- Testing más fácil
- Mantenibilidad
- Documentación clara

### Route Groups de Next.js

```
app/
├── (dashboard)/     # Rutas protegidas
│   ├── dashboard/
│   ├── pagares/
│   └── usuarios/
├── login/           # Ruta pública
└── api/             # API endpoints
```

**Beneficios:**
- Organización sin afectar URLs
- Layouts específicos por grupo
- Middleware compartido

---

## 🔐 SEGURIDAD Y PERMISOS

### Sistema RBAC (Role-Based Access Control)

#### Modelo de Datos
```typescript
User → UserType (Role)
       ↓
    Permissions (granulares)
```

#### Niveles de Permiso
1. **Page Level:** Middleware protege rutas completas
2. **Component Level:** Componentes validan permisos
3. **API Level:** API routes validan roles
4. **Data Level:** Queries filtran por empresa

#### Roles Definidos
```typescript
{
  admin: ['*'],           // Acceso total
  gerente: [              // Ve todo, crea tareas
    'view:all',
    'create:tasks',
    'view:reports'
  ],
  vendedor: [             // Solo sus ventas
    'view:own-sales',
    'create:quotations'
  ],
  cobranza: [             // Pagarés y cobranza
    'view:pagares',
    'update:payments'
  ],
  contador: [             // Reportes financieros
    'view:reports',
    'export:data'
  ]
}
```

### Middleware de Autorización

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  // 1. Verificar sesión
  // 2. Validar rol para ruta
  // 3. Filtrar por empresa
  // 4. Permitir o denegar
}
```

---

## 🔄 SISTEMA DE SINCRONIZACIÓN

### Arquitectura

```
RAMP (MySQL AWS) → Sync Service → Local DB (MySQL)
                        ↓
                  Validation & Transform
                        ↓
                    Prisma ORM
```

### Componentes

#### 1. Configuración de Tablas
```typescript
// scripts/sync-tables.config.ts
const TABLES_CONFIG = {
  clients: {
    primaryKey: 'id',
    dependencies: [],
    priority: 1
  },
  transactions: {
    primaryKey: 'id',
    dependencies: ['clients', 'projects', 'units'],
    priority: 3
  }
  // ... 30+ tablas
}
```

#### 2. Servicio Genérico
```typescript
// src/services/sync/directSyncService.ts
class DirectSyncService {
  async syncTable(tableName, config) {
    // 1. Fetch de RAMP
    // 2. Transform (BigInt→String, tinyint→Boolean)
    // 3. Validate
    // 4. Upsert en local
    // 5. Log resultados
  }
}
```

#### 3. Orquestador
```typescript
// src/services/sync/syncOrchestrator.ts
class SyncOrchestrator {
  async syncAll() {
    // 1. Ordenar por dependencias
    // 2. Sync en paralelo (respetando deps)
    // 3. Manejo de errores
    // 4. Retry con backoff
  }
}
```

### Conversiones de Tipos

| MySQL | Prisma | Conversión |
|-------|--------|------------|
| `BIGINT` | `String` | `record.field.toString()` |
| `tinyint(1)` | `Boolean` | `record.field === 1` |
| `int` | `Int` | `parseInt(record.field)` |
| `decimal` | `Decimal` | `new Decimal(record.field)` |
| `datetime` | `DateTime` | `new Date(record.field)` |

### Nomenclatura

**IMPORTANTE:** Base de datos usa camelCase, NO snake_case

```typescript
// ✅ CORRECTO
{
  projectId: 1,
  createdAt: new Date(),
  fisicalPerson: true
}

// ❌ INCORRECTO
{
  project_id: 1,
  created_at: new Date(),
  fisical_person: true
}
```

---

## 🏢 MULTIEMPRESA

### Diseño

**Modelo:** Tenant-based (cada usuario pertenece a 1 empresa)

```typescript
User → Company
       ↓
    All Data
```

### Implementación

#### 1. Schema
```prisma
model User {
  id        String   @id
  companyId String   @map("company_id")
  company   Company  @relation(fields: [companyId])
}

model Client {
  id        String   @id
  companyId String   @map("company_id")
  company   Company  @relation(fields: [companyId])
}

// Todas las tablas principales tienen companyId
```

#### 2. Middleware Global
```typescript
// Automáticamente filtra queries por empresa del usuario
prisma.$use(async (params, next) => {
  if (params.model && hasCompanyField(params.model)) {
    params.args.where = {
      ...params.args.where,
      companyId: session.user.companyId
    }
  }
  return next(params)
})
```

#### 3. Selector de Empresa (Futuro)
Para usuarios con acceso a múltiples empresas:
```typescript
// Cambiar contexto de empresa activa
setActiveCompany(companyId)
```

---

## 📊 MANEJO DE DATOS

### React Query para State Management

```typescript
// Configuración global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutos
      cacheTime: 10 * 60 * 1000,  // 10 minutos
      refetchOnWindowFocus: false
    }
  }
})
```

**Beneficios:**
- Cache automático
- Revalidación inteligente
- Optimistic updates
- Menos boilerplate

### Patrón de API Routes

```typescript
// app/api/[resource]/route.ts
export async function GET(request: Request) {
  // 1. Validar sesión
  // 2. Validar permisos
  // 3. Parsear query params
  // 4. Ejecutar query Prisma
  // 5. Transformar respuesta
  // 6. Return JSON
}
```

---

## 🎨 UI/UX PATTERNS

### Componentes Base: shadcn/ui

**Motivo:** 
- Copy-paste, no NPM package
- Personalización total
- Accesibilidad built-in
- Tailwind CSS

### Loading States

```typescript
// Patrón consistente
{isLoading && <Skeleton />}
{error && <ErrorState />}
{data && <Content />}
```

### Error Handling

```typescript
// Componente ErrorBoundary global
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## 📈 PERFORMANCE

### Optimizaciones Implementadas

1. **Server Components por defecto**
   - Menos JavaScript en cliente
   - Mejor SEO

2. **Paginación Server-Side**
   - Tablas grandes (500+ registros)
   - Filtros en SQL, no en memoria

3. **React Query Cache**
   - Evita refetch innecesarios
   - Stale-while-revalidate

4. **Dynamic Imports**
   ```typescript
   const Chart = dynamic(() => import('recharts'), {
     ssr: false
   })
   ```

5. **Image Optimization**
   ```typescript
   <Image
     src="/logo.png"
     width={100}
     height={100}
     priority={true}  // Above the fold
   />
   ```

### Queries Optimizadas

```sql
-- Usar índices
CREATE INDEX idx_company ON clients(company_id);
CREATE INDEX idx_project ON transactions(project);

-- Evitar N+1
SELECT * FROM transactions
JOIN clients ON transactions.client = clients.id
WHERE transactions.company_id = ?
```

---

## 🔧 TOOLING

### Development
- **TypeScript:** Type safety
- **ESLint:** Linting
- **Prettier:** Code formatting
- **Husky:** Git hooks

### Testing (Futuro)
- **Jest:** Unit tests
- **React Testing Library:** Component tests
- **Playwright:** E2E tests

### CI/CD
- **GitHub Actions:** Automated tests
- **Vercel:** Automated deploys
- **Preview Deployments:** Por cada PR

---

## 🚀 DEPLOYMENT

### Staging
- **Platform:** Vercel
- **URL:** [PENDIENTE]
- **Branch:** `develop`
- **Auto-deploy:** En cada push

### Production
- **Platform:** Vercel Pro
- **URL:** [PENDIENTE]
- **Branch:** `main`
- **Deploy:** Manual approval

### Base de Datos
- **Staging:** Railway MySQL
- **Production:** PlanetScale
- **Backups:** Diarios automáticos
- **Migrations:** Prisma Migrate

---

## 📝 DECISIONES PENDIENTES

### Evaluando
- [ ] **Notificaciones:** Pusher vs Socket.io vs Server-Sent Events
- [ ] **File Storage:** AWS S3 vs Uploadthing vs Cloudinary
- [ ] **Analytics:** Posthog vs Mixpanel vs Google Analytics
- [ ] **Monitoring:** Sentry vs LogRocket

### Para Fase 2
- [ ] **Search Engine:** Algolia vs MeiliSearch
- [ ] **Queue System:** BullMQ vs inngest
- [ ] **Scheduled Jobs:** Vercel Cron vs node-cron

---

## 🔄 EVOLUCIÓN DEL SISTEMA

### Versión 1.0 (Nov 2025)
- Sistema de pagarés
- Dashboard básico
- Multiempresa
- Roles y permisos

### Versión 1.5 (Ene 2026)
- Master de Proyecto
- Sistema de documentos
- Integraciones Google

### Versión 2.0 (Mar 2026)
- Constructor de análisis
- Workflows
- Mobile app

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org
- shadcn/ui: https://ui.shadcn.com

### Inspiración
- Retool: Low-code platform
- Notion: Collaboration
- Tableau: Analytics

---

**ÚLTIMA ACTUALIZACIÓN POR:** Lalo
**PRÓXIMA REVISIÓN:** Sprint 2 (después de pagarés)