# 🚀 Railway Deploy - Guía Actualizada

Esta guía corrige el problema de `DATABASE_URL` durante el build y proporciona un proceso completo para deployar tu sistema a Railway.

## 🛠️ Problema Resuelto

**Error original:**
```
Error: Environment variable not found: DATABASE_URL.
```

**Causa:** El script `build` en package.json incluía `prisma db push` que requiere `DATABASE_URL`, pero esta variable solo está disponible en runtime, no durante el build.

**Solución:** Separamos la generación de Prisma Client del push a la base de datos.

## 📋 Cambios Realizados

### 1. package.json
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "build:production": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 2. railway.toml
```toml
[deploy]
startCommand = "npx prisma migrate deploy && node server.js"
```

### 3. Nuevo Script de Deploy
- `scripts/railway-deploy-complete.ts` - Deploy completo con migración de datos

## 🚀 Cómo Deployar

### Opción 1: Script Automatizado (Recomendado)
```bash
npx ts-node scripts/railway-deploy-complete.ts
```

### Opción 2: Paso a Paso Manual

#### 1. Configurar Railway
```bash
npm install -g @railway/cli
railway login
railway link  # Vincula tu proyecto existente
```

#### 2. Deploy sin Datos
```bash
railway up --detach
```

#### 3. Ejecutar Migraciones
```bash
railway run npx prisma migrate deploy
```

#### 4. Migrar Solo Datos del Sistema
```bash
npx ts-node scripts/migrate-system-tables.ts
```

## 📊 Tablas Incluidas en la Migración

El script migra **SOLO las tablas del sistema propio** (87 tablas):

### Sistema Core
- ✅ `users`, `roles`, `permissions`, `companies`
- ✅ `accounts`, `sessions`, `verification_tokens`

### Configuración
- ✅ `sync_logs`, `sync_config`
- ✅ `webhook_configs`, `webhook_sync_logs`

### Catálogos
- ✅ `marital_statuses`, `credit_types`, `client_statuses`
- ✅ `project_statuses`, `transaction_statuses`

### Datos del Negocio
- ✅ `clients`, `projects`, `agencies`, `agents`
- ✅ `quotations`, `transactions`, `movements`
- ✅ `promissories`, `creditos`, `invoices`

### Excluidas (Se sincronizan automáticamente)
- ❌ Tablas VSControl (`vsc_*`)
- ❌ Tablas RAMP (vía webhooks)

## 🔧 Comandos Útiles Post-Deploy

```bash
# Ver la aplicación
railway open

# Ver logs en tiempo real
railway logs

# Acceder a la base de datos
railway run npx prisma studio

# Ver variables de entorno
railway variables

# Conectar a MySQL directamente
railway run mysql

# Verificar migración
railway run npx prisma db seed
```

## 🔍 Verificación

1. **Aplicación funcionando:**
   ```bash
   railway open
   ```

2. **Login funcional:**
   - Intenta acceder al sistema
   - Verifica autenticación

3. **Datos correctos:**
   ```bash
   railway run npx prisma studio
   ```

4. **Sincronización automática:**
   - Las tablas VSControl se poblarán automáticamente
   - Los webhooks de RAMP comenzarán a funcionar

## ⚠️ Consideraciones Importantes

### Variables de Entorno Necesarias
Asegúrate de tener configuradas en Railway:

```env
DATABASE_URL=<auto-generada>
SHADOW_DATABASE_URL=<auto-generada>
NEXTAUTH_SECRET=<tu-secret>
NEXTAUTH_URL=<tu-url-de-railway>

# Variables de VSControl
VSCONTROL_BASE_URL=<tu-url>
VSCONTROL_USERNAME=<usuario>
VSCONTROL_PASSWORD=<password>

# Variables de RAMP
RAMP_WEBHOOK_SECRET=<secret>
```

### Sincronización Automática
- **VSControl:** Se sincroniza automáticamente cada 30 minutos
- **RAMP:** Funciona vía webhooks en tiempo real
- **Sistema:** Los datos migrados están listos inmediatamente

## 🆘 Solución de Problemas

### Build Falla en Railway
```bash
# Verifica que no haya DATABASE_URL en build
npm run build  # Debería funcionar sin variables de BD
```

### Migración Falla
```bash
# Ejecuta manualmente
railway run npx prisma migrate deploy
railway run npx prisma generate
```

### Datos No Aparecen
```bash
# Verifica conexión a BD
railway run mysql -e "SHOW TABLES;"

# Re-ejecuta migración de datos
npx ts-node scripts/migrate-system-tables.ts
```

### Sincronización VSControl No Funciona
```bash
# Verifica variables
railway variables

# Prueba conexión
railway run npx ts-node scripts/test-vscontrol-connection.ts
```

## 📝 Scripts Disponibles

- `railway-deploy-complete.ts` - Deploy completo automatizado
- `migrate-system-tables.ts` - Solo migración de datos del sistema
- `test-vscontrol-connection.ts` - Prueba conexión VSControl
- `diagnose-vscontrol.ts` - Diagnóstico completo VSControl

## 🎉 ¡Listo!

Con estos cambios, tu deploy a Railway debería funcionar sin problemas. El sistema se construirá correctamente, las migraciones se ejecutarán en runtime, y tus datos del sistema se migrarán de forma segura.
