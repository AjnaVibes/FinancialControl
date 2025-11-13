# 🚂 Deploy en Railway con Git + MySQL

## 📋 Proceso Completo

**IMPORTANTE**: Los datos de la base de datos NO se suben a través de Git. Railway maneja la BD como un servicio separado.

## 🎯 Flujo de Deploy

```mermaid
graph LR
    A[Tu Código en Git] -->|Push| B[Railway]
    B --> C[Deploy App Next.js]
    D[MySQL Railway] --> E[Servicio Separado]
    C --> F[Conecta via DATABASE_URL]
    E --> F
    G[Datos Locales] -->|Migración Manual| E
```

## 🚀 Paso a Paso

### 1️⃣ Preparar tu Proyecto para Git

#### A. Verificar `.gitignore`
```gitignore
# Asegúrate de tener esto en .gitignore
.env
.env.local
.env.production
node_modules/
.next/
backups/
*.sql
*.sql.gz
```

#### B. Crear archivo de configuración para Railway
Crea `railway.json` en la raíz:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### C. Agregar script de setup en `package.json`
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed"
  }
}
```

### 2️⃣ Subir Código a GitHub

```bash
# Si aún no tienes repositorio
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### 3️⃣ Crear Proyecto en Railway

#### Opción A: Desde Railway Dashboard

1. **Inicia sesión** en [Railway](https://railway.app)

2. **Nuevo Proyecto desde GitHub**
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway para acceder a tu GitHub
   - Selecciona tu repositorio

3. **Agregar MySQL**
   - En tu proyecto, click "New Service"
   - Selecciona "Database" → "MySQL"
   - Railway creará automáticamente las variables:
     - `MYSQL_URL`
     - `MYSQLHOST`
     - `MYSQLPORT`
     - `MYSQLDATABASE`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`

#### Opción B: Usando Railway CLI

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto desde Git
railway init

# Conectar con GitHub
railway link

# Agregar MySQL
railway add mysql

# Deploy
railway up
```

### 4️⃣ Configurar Variables de Entorno

En Railway Dashboard → Tu Proyecto → Variables:

```env
# Railway genera automáticamente para MySQL
DATABASE_URL=${{MySQL.DATABASE_URL}}

# Agrega manualmente las demás
NEXTAUTH_URL=https://tu-app.up.railway.app
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-secret
ALLOWED_DOMAINS=tudominio.com
MAKE_WEBHOOK_SECRET=tu-webhook-secret
SYNC_INTERVAL_MINUTES=30
VSCONTROL_API_URL=http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx
VSCONTROL_USER=VSControl
VSCONTROL_PASSWORD=vsm1234@
VSCONTROL_EMPRESA=RESPALDO GOVACASA

# Para migraciones (temporal)
SHADOW_DATABASE_URL=mysql://root:password@localhost:3306/shadow_db
```

### 5️⃣ Aplicar Migraciones de Prisma

#### Primera vez (estructura vacía):

```bash
# Desde tu local, conectado a Railway
railway run npx prisma migrate deploy

# O desde Railway Shell
npx prisma migrate deploy
```

#### Si ya tienes migraciones locales:

```bash
# Ver estado
railway run npx prisma migrate status

# Aplicar todas las migraciones
railway run npx prisma migrate deploy
```

### 6️⃣ Migrar Datos Existentes

**Los datos NO se suben por Git**. Debes migrarlos manualmente:

#### Método 1: Usando el Script de Migración

```bash
# Desde tu local
npx ts-node scripts/migrate-to-railway.ts

# Selecciona:
# 1. Exportar backup completo
# 4. Importar a Railway (usa las credenciales del dashboard)
```

#### Método 2: Exportar/Importar Manual

```bash
# 1. Exportar datos locales
mysqldump -u root -p tu_bd_local > backup.sql

# 2. Obtener credenciales de Railway
# Dashboard → MySQL → Variables

# 3. Importar a Railway
mysql -h containers-us-west-XXX.railway.app \
      -P 7XXX \
      -u root \
      -pTU_PASSWORD \
      railway < backup.sql
```

#### Método 3: Script Automatizado

Crea `scripts/deploy-data.sh`:

```bash
#!/bin/bash

# Configuración
LOCAL_DB="tu_bd_local"
RAILWAY_HOST="containers-us-west-XXX.railway.app"
RAILWAY_PORT="7XXX"
RAILWAY_USER="root"
RAILWAY_PASS="TU_PASSWORD"
RAILWAY_DB="railway"

echo "🔄 Exportando datos locales..."
mysqldump -u root -p $LOCAL_DB > temp_backup.sql

echo "📤 Importando a Railway..."
mysql -h $RAILWAY_HOST -P $RAILWAY_PORT -u $RAILWAY_USER -p$RAILWAY_PASS $RAILWAY_DB < temp_backup.sql

echo "🧹 Limpiando..."
rm temp_backup.sql

echo "✅ Migración completada!"
```

### 7️⃣ Verificar Deploy

1. **Verifica los logs**:
   - Railway Dashboard → Tu App → View Logs

2. **Prueba la conexión a BD**:
   ```bash
   railway run npx prisma db pull
   ```

3. **Verifica datos migrados**:
   ```bash
   railway run npx ts-node scripts/verify-railway-data.ts
   ```

## 🔄 Flujo de Trabajo Continuo

### Para futuros cambios:

```bash
# 1. Hacer cambios locales
git add .
git commit -m "Nueva funcionalidad"

# 2. Push a GitHub
git push origin main

# 3. Railway detecta el push y hace deploy automático

# 4. Si hay cambios en BD
railway run npx prisma migrate deploy
```

## ⚠️ Puntos Importantes

### ❌ Lo que NO debes hacer:

- **NUNCA** subas archivos `.sql` a Git
- **NUNCA** incluyas credenciales en el código
- **NUNCA** subas la carpeta `backups/` a Git
- **NO** uses `prisma migrate dev` en producción

### ✅ Lo que SÍ debes hacer:

- **SIEMPRE** usa variables de entorno
- **SIEMPRE** haz backup antes de migrar
- **USA** `prisma migrate deploy` en producción
- **MANTÉN** el schema.prisma actualizado en Git

## 🛠️ Configuración Build en Railway

Railway detecta automáticamente Next.js, pero puedes personalizar en `railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "web"
port = 3000
```

## 🔍 Debugging

### Si el deploy falla:

1. **Revisa los logs**:
   ```bash
   railway logs
   ```

2. **Verifica variables de entorno**:
   ```bash
   railway variables
   ```

3. **Prueba localmente con variables de Railway**:
   ```bash
   railway run npm run dev
   ```

## 📊 Monitoreo Post-Deploy

### Dashboard Metrics
- CPU/RAM usage
- Request count
- Response times
- Database connections

### Verificar integridad:
```javascript
// scripts/health-check.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function healthCheck() {
  try {
    // Verificar conexión
    await prisma.$connect()
    
    // Verificar tablas críticas
    const checks = {
      users: await prisma.user.count(),
      clients: await prisma.client.count(),
      projects: await prisma.project.count(),
      // ... más tablas
    }
    
    console.log('✅ Health Check Passed')
    console.table(checks)
    
    return true
  } catch (error) {
    console.error('❌ Health Check Failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

healthCheck()
```

## 🎯 Checklist de Deploy

- [ ] Código en GitHub
- [ ] `.env` en `.gitignore`
- [ ] Proyecto creado en Railway
- [ ] MySQL agregado como servicio
- [ ] Variables de entorno configuradas
- [ ] App conectada a GitHub
- [ ] Deploy inicial exitoso
- [ ] Migraciones aplicadas
- [ ] Datos migrados desde local
- [ ] Verificación de integridad
- [ ] Testing en producción

## 🆘 Solución de Problemas Comunes

### "Can't connect to MySQL"
- Verifica que MySQL esté activo en Railway
- Revisa la variable `DATABASE_URL`
- Asegúrate de que no haya espacios en las credenciales

### "Prisma schema not found"
- Asegúrate de que `prisma generate` se ejecute en el build
- Verifica que `schema.prisma` esté en Git

### "Migration failed"
- Configura `SHADOW_DATABASE_URL`
- Usa `migrate deploy`, no `migrate dev`

### "Data not showing"
- Los datos se migran por separado, no a través de Git
- Ejecuta el script de migración después del deploy

---

**Recuerda**: Git sube tu **código**, Railway crea la **base de datos**, y tú migras los **datos** por separado.
