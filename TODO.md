# ✅ TODO - FINANCIAL CONTROL

**Última actualización:** 28 Octubre 2025

---

## 🎯 ROADMAP V1 (15 Noviembre 2025)

```
[██████░░░░░░░░░░░░░░░░░░] 35% completado

Días restantes: 14
Sprint actual: 1 (Fundamentos)
```

---

## 🔥 CRÍTICO (HOY/MAÑANA)

### 1. Corregir error campo `quotation`
- [ ] Cambiar schema: `quotation DateTime?` → `quotation Int?`
- [ ] Actualizar directSyncService.ts mappeo
- [ ] Agregar `parseInt()` en conversión
- [ ] Testing con registros de references
- [ ] Commit con fix

**Prioridad:** CRÍTICA 🔴
**Blocker:** Sí
**Tiempo estimado:** 1-2 hrs
**Asignado a:** Lalo

---

### 2. Fix Multiempresa
- [ ] Documentar cómo debe funcionar
- [ ] Identificar qué está roto específicamente
- [ ] Corregir filtros por empresa
- [ ] Agregar middleware de filtrado automático
- [ ] Testing con múltiples empresas

**Prioridad:** CRÍTICA 🔴
**Blocker:** Sí
**Tiempo estimado:** 3-4 hrs
**Asignado a:** Lalo

---

## 🏃 SPRINT 1: Fundamentos (Día 1-2)

### Sistema de Permisos
- [ ] Refinar modelo User/UserType en Prisma
- [ ] Crear middleware de autenticación
- [ ] Crear middleware de autorización
- [ ] HOC para proteger componentes
- [ ] Helper `can(user, permission)`
- [ ] Testing de permisos

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 4 hrs

### Layout y Navegación
- [ ] Refinar sidebar con navegación
- [ ] Header con perfil de usuario
- [ ] Breadcrumbs
- [ ] Mobile responsive
- [ ] Dark mode (opcional)

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 3 hrs

---

## 📊 SPRINT 2: Pagarés (Día 3-4)

### Queries y Backend
- [ ] Finalizar query SQL de pagarés
- [ ] API route `/api/pagares`
- [ ] Validación con Zod
- [ ] Paginación server-side
- [ ] Testing de API

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 3 hrs

### UI de Pagarés
- [ ] Componente `<PagaresTable />`
- [ ] Filtros avanzados (proyecto, cliente, estado)
- [ ] Búsqueda por cliente/unidad
- [ ] Ordenamiento por columnas
- [ ] Indicadores visuales (vencido, al día)

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 4 hrs

### Exportación
- [ ] Exportar a Excel (xlsx)
- [ ] Incluir filtros aplicados
- [ ] Formato profesional
- [ ] Testing descarga

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 2 hrs

### Vista Detalle
- [ ] Modal con detalle completo de pagaré
- [ ] Timeline de pagos
- [ ] Información de cliente
- [ ] Información de proyecto/unidad
- [ ] Botones de acción

**Prioridad:** BAJA 🔵
**Tiempo estimado:** 2 hrs

---

## 📈 SPRINT 3: Dashboard DG (Día 5-7)

### KPIs de Ventas
- [ ] Total ventas (general y por proyecto)
- [ ] Unidades vendidas vs disponibles
- [ ] Valor promedio de venta
- [ ] Tasa de conversión
- [ ] Gráfica ventas mensuales (últimos 12 meses)
- [ ] Comparativa mes anterior

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 6 hrs

### KPIs Financieros
- [ ] Ingresos totales (real-time)
- [ ] Cartera vencida (monto y cantidad)
- [ ] Créditos disponibles por proyecto
- [ ] Intereses generados
- [ ] Proyección de ingresos (30/60/90 días)
- [ ] Flujo de efectivo

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 6 hrs

### KPIs de Cobranza
- [ ] Pagos del mes
- [ ] Pagos atrasados
- [ ] Clientes morosos (Top 10)
- [ ] Eficiencia de cobranza
- [ ] Gráfica de cobranza mensual

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 4 hrs

### Visualizaciones
- [ ] Gráfica: Ingresos por mes (líneas)
- [ ] Gráfica: Distribución por proyecto (pie)
- [ ] Gráfica: Evolución cartera vencida (área)
- [ ] Gráfica: Comparativa proyectos (barras)

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 4 hrs
**Librería:** Recharts

### Filtros Globales
- [ ] Selector de proyecto(s)
- [ ] Rango de fechas
- [ ] Sincronización entre widgets
- [ ] Guardar filtros preferidos
- [ ] Reset filters

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 3 hrs

### Exportación Dashboard
- [ ] Exportar a PDF
- [ ] Incluir gráficas como imágenes
- [ ] Formato ejecutivo
- [ ] Envío por email (opcional)

**Prioridad:** BAJA 🔵
**Tiempo estimado:** 3 hrs

---

## 💬 SPRINT 4: Colaboración (Día 8-9)

### Sistema de Tareas
- [ ] Modelo Prisma para Tasks
- [ ] CRUD completo de tareas
- [ ] Asignar tarea a usuario(s)
- [ ] Estados (pendiente, en progreso, completada)
- [ ] Prioridades (baja, media, alta, urgente)
- [ ] Fechas de vencimiento
- [ ] API routes

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 4 hrs

### UI de Tareas
- [ ] Componente `<TaskList />`
- [ ] Modal crear/editar tarea
- [ ] Vista "Mis Tareas"
- [ ] Filtros (estado, prioridad, asignado)
- [ ] Marcar como completada
- [ ] Indicadores visuales

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 3 hrs

### Sistema de Comentarios
- [ ] Modelo Prisma para Comments
- [ ] Agregar comentarios a entidades (tasks, projects)
- [ ] Timeline de actividad
- [ ] API routes
- [ ] Componente `<CommentList />`
- [ ] Componente `<CommentForm />`

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 3 hrs

### Notificaciones
- [ ] Modelo Prisma para Notifications
- [ ] Notificar al asignar tarea
- [ ] Notificar en @menciones
- [ ] Centro de notificaciones
- [ ] Badge con contador
- [ ] Marcar como leída
- [ ] Envío por email (Resend/SendGrid)

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 4 hrs

### @Menciones
- [ ] Parser de @username en comentarios
- [ ] Autocomplete de usuarios
- [ ] Resaltar menciones
- [ ] Notificar usuarios mencionados

**Prioridad:** BAJA 🔵
**Tiempo estimado:** 2 hrs

---

## 🧪 SPRINT 5: Testing (Día 10-11)

### Testing Manual
- [ ] Flujo completo de pagarés
- [ ] Flujo completo de dashboard
- [ ] Flujo completo de tareas
- [ ] Testing de permisos por rol
- [ ] Testing multiempresa
- [ ] Testing en diferentes navegadores
- [ ] Testing responsive (móvil/tablet)

**Prioridad:** CRÍTICA 🔴
**Tiempo estimado:** 6 hrs

### Corrección de Bugs
- [ ] Listar todos los bugs encontrados
- [ ] Priorizar por severidad
- [ ] Corregir bugs críticos
- [ ] Corregir bugs importantes
- [ ] Corregir bugs menores (si hay tiempo)
- [ ] Re-testing

**Prioridad:** CRÍTICA 🔴
**Tiempo estimado:** 6 hrs

### UX/UI Polish
- [ ] Consistencia visual
- [ ] Spacing y padding
- [ ] Loading states en todas las vistas
- [ ] Error states con mensajes amigables
- [ ] Empty states con call-to-action
- [ ] Animaciones y transiciones suaves
- [ ] Tooltips explicativos

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 4 hrs

### Performance Optimization
- [ ] Lighthouse audit
- [ ] Optimizar imágenes
- [ ] Lazy loading de componentes pesados
- [ ] Code splitting
- [ ] Reduce bundle size

**Prioridad:** BAJA 🔵
**Tiempo estimado:** 2 hrs

---

## 🚀 SPRINT 6: Deploy (Día 12-14)

### Setup Deploy
- [ ] Crear cuenta Vercel/Railway
- [ ] Conectar repositorio GitHub
- [ ] Configurar variables de entorno
- [ ] Configurar build settings
- [ ] Primera prueba de deploy

**Prioridad:** CRÍTICA 🔴
**Tiempo estimado:** 2 hrs

### Base de Datos Producción
- [ ] Elegir proveedor (PlanetScale/Railway)
- [ ] Crear instancia de producción
- [ ] Migrar schema con Prisma
- [ ] Configurar conexión segura
- [ ] Testing de conexión

**Prioridad:** CRÍTICA 🔴
**Tiempo estimado:** 2 hrs

### Sincronización Inicial
- [ ] Sincronizar todas las tablas de RAMP
- [ ] Validar integridad de datos
- [ ] Verificar relaciones
- [ ] Testing queries en producción

**Prioridad:** CRÍTICA 🔴
**Tiempo estimado:** 3 hrs

### Dominio y SSL
- [ ] Registrar dominio (opcional)
- [ ] Configurar DNS
- [ ] SSL automático (Vercel lo hace)
- [ ] Redirecciones HTTP→HTTPS

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 1 hr

### Seguridad
- [ ] Variables de entorno en producción
- [ ] Rate limiting en APIs
- [ ] CORS configurado
- [ ] Headers de seguridad
- [ ] Validación de inputs

**Prioridad:** ALTA 🟡
**Tiempo estimado:** 2 hrs

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Setup analytics (Posthog)
- [ ] Setup uptime monitoring
- [ ] Configurar alertas

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 2 hrs

### Documentación Final
- [ ] README.md actualizado
- [ ] Guía de despliegue
- [ ] Guía de usuario básica
- [ ] Video tutorial (5-10 min)
- [ ] Changelog

**Prioridad:** MEDIA 🟢
**Tiempo estimado:** 3 hrs

### Go-Live
- [ ] Testing final en producción
- [ ] Crear usuarios iniciales
- [ ] Configurar emails
- [ ] Capacitación rápida al equipo
- [ ] 🎉 LANZAMIENTO OFICIAL

**Prioridad:** CRÍTICA 🔴
**Tiempo estimado:** 2 hrs

---

## 🔮 BACKLOG (Futuro - Después de V1)

### Fase 2 Features
- [ ] Master de Proyecto completo
- [ ] Sistema de documentos
- [ ] Firmas electrónicas
- [ ] Integraciones Google (Gmail, Drive, Calendar)
- [ ] Notificaciones push (PWA)
- [ ] Integración VS Control (egresos)
- [ ] App móvil (React Native)

### Nice to Have
- [ ] Búsqueda global
- [ ] Temas personalizables
- [ ] Keyboard shortcuts
- [ ] Modo offline
- [ ] Export a diferentes formatos
- [ ] API pública con documentación
- [ ] Webhooks para integraciones

### Optimizaciones
- [ ] Testing automatizado (Jest + Playwright)
- [ ] CI/CD pipeline completo
- [ ] A/B testing framework
- [ ] Feature flags
- [ ] Caching avanzado (Redis)
- [ ] CDN para assets

---

## 📊 MÉTRICAS DE PROGRESO

### Por Sprint
- Sprint 1 (Fundamentos): ███████░░░░░░░░░░░░░░ 40%
- Sprint 2 (Pagarés): ████████████████░░░░ 85%
- Sprint 3 (Dashboard): ░░░░░░░░░░░░░░░░░░░░ 0%
- Sprint 4 (Colaboración): ░░░░░░░░░░░░░░░░░░░░ 0%
- Sprint 5 (Testing): ░░░░░░░░░░░░░░░░░░░░ 0%
- Sprint 6 (Deploy): ░░░░░░░░░░░░░░░░░░░░ 0%

### Por Categoría
- Backend/API: ████████████████░░░░ 80%
- Frontend/UI: ██████████░░░░░░░░░░ 50%
- Testing: ░░░░░░░░░░░░░░░░░░░░ 0%
- Deploy: ░░░░░░░░░░░░░░░░░░░░ 0%

---

## 🏷️ LEYENDA DE PRIORIDADES

🔴 **CRÍTICA** - Blocker, debe hacerse inmediatamente
🟡 **ALTA** - Importante para V1, hacer pronto
🟢 **MEDIA** - Nice to have en V1, puede esperar un poco
🔵 **BAJA** - Puede moverse a V1.1 si falta tiempo

---

## 📝 NOTAS

### Decisiones Tomadas
- ✅ Quitamos Master de Proyecto de V1 para acelerar
- ✅ Enfoque en pagarés + dashboard + colaboración básica
- ✅ Deploy en Vercel + PlanetScale

### Riesgos Identificados
- ⚠️ Sincronización de datos puede tomar tiempo
- ⚠️ Testing manual extenso (2 días completos)
- ⚠️ Correcciones de multiempresa pueden ser complejas

### Dependencias Externas
- 🔗 Acceso a BD RAMP (ya tenemos)
- 🔗 Cuenta GitHub (ya tenemos)
- 🔗 Presupuesto hosting (~$50 USD/mes)

---

**ÚLTIMA ACTUALIZACIÓN POR:** Lalo
**PRÓXIMA ACTUALIZACIÓN:** Diaria al final del día