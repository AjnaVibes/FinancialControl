# 🚂 Guía de Deploy en Railway - Base de Datos MySQL

## 📋 Resumen
Esta guía te ayudará a hacer deploy de tu base de datos MySQL en Railway y migrar todos tus datos locales.

## 🎯 Objetivo
- Deploy de base de datos MySQL en Railway
- Migración de datos locales existentes
- Configuración de variables de entorno
- Conexión con tu aplicación

## 📦 Pre-requisitos

1. **Cuenta en Railway**: https://railway.app
2. **Railway CLI** (opcional pero recomendado):
   ```bash
   npm install -g @railway/cli
   ```
3. **MySQL Workbench o DBeaver** para exportar/importar datos
4. **Datos locales respaldados**

## 🚀 Paso 1: Crear Base de Datos en Railway

### Opción A: Desde Railway Dashboard

1. Inicia sesión en [Railway](https://railway.app)
2. Crea un nuevo proyecto
3. Click en "New Service"
4. Selecciona "MySQL"
5. Railway creará automáticamente la base de datos

### Opción B: Desde Railway CLI

```bash
# Login
railway login

# Crear nuevo proyecto
railway init

# Agregar MySQL
railway add
# Selecciona MySQL
```

## 🔧 Paso 2: Obtener Credenciales de Conexión

En Railway Dashboard:
1. Click en tu servicio MySQL
2. Ve a la pestaña "Variables"
3. Encontrarás:
   - `MYSQL_URL` (connection string completa)
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

Tu `DATABASE_URL` será algo como:
```
mysql://root:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway
```

## 📤 Paso 3: Exportar Datos Locales

### Método 1: mysqldump (Recomendado para todos los datos)

```bash
# Exportar estructura y datos
mysqldump -u tu_usuario -p tu_base_local > backup_completo.sql

# Solo estructura (si quieres aplicar migraciones de Prisma)
mysqldump -u tu_usuario -p --no-data tu_base_local > estructura.sql

# Solo datos
mysqldump -u tu_usuario -p --no-create-info tu_base_local > datos.sql
```

### Método 2: Exportar tablas específicas

```bash
# Exportar tablas críticas con datos
mysqldump -u tu_usuario -p tu_base_local \
  clients \
  users \
  projects \
  transactions \
  quotations \
  units \
  movements \
  promissories \
  creditos \
  invoices \
  > datos_importantes.sql
```

### Método 3: Usando MySQL Workbench

1. Conecta a tu base local
2. Server → Data Export
3. Selecciona tu esquema
4. Selecciona las tablas
5. Export to Self-Contained File
6. Include Create Schema: NO (si usarás Prisma)
7. Start Export

## 📥 Paso 4: Importar Datos a Railway

### Método 1: Railway CLI + MySQL Client

```bash
# Conectar a Railway MySQL
railway run mysql -h $MYSQLHOST -P $MYSQLPORT -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE

# O usar la URL directamente
mysql mysql://root:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway

# Importar datos
mysql -h containers-us-west-XXX.railway.app -P PORT -u root -pPASSWORD railway < backup_completo.sql
```

### Método 2: MySQL Workbench

1. Crear nueva conexión:
   - Hostname: containers-us-west-XXX.railway.app
   - Port: El puerto proporcionado
   - Username: root
   - Password: La contraseña proporcionada

2. Server → Data Import
3. Import from Self-Contained File
4. Selecciona tu archivo .sql
5. Start Import

## 🔄 Paso 5: Aplicar Migraciones de Prisma

### Configurar Variables de Entorno

Crea un archivo `.env.production`:

```env
# Railway MySQL
DATABASE_URL="mysql://root:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway"
SHADOW_DATABASE_URL="mysql://root:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway_shadow"

# Resto de variables
NEXTAUTH_URL="https://tu-app.railway.app"
NEXTAUTH_SECRET="tu-secret-seguro"
# ... otras variables
```

### Ejecutar Migraciones

```bash
# Usar el archivo de producción
cp .env.production .env

# Verificar el estado de las migraciones
npx prisma migrate status

# Si es la primera vez (base vacía)
npx prisma migrate deploy

# Si ya importaste la estructura, marca las migraciones como aplicadas
npx prisma migrate resolve --applied "20251012042126_init"
npx prisma migrate resolve --applied "20251012180454_add_clients_table"
# ... continuar con todas tus migraciones

# Generar el cliente de Prisma
npx prisma generate
```

## 🔍 Paso 6: Verificar Integridad de Datos

### Script de Verificación

```typescript
// scripts/verify-railway-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyData() {
  console.log('🔍 Verificando datos en Railway...')
  
  const counts = {
    users: await prisma.user.count(),
    clients: await prisma.client.count(),
    projects: await prisma.project.count(),
    units: await prisma.unit.count(),
    quotations: await prisma.quotation.count(),
    transactions: await prisma.transaction.count(),
    movements: await prisma.movement.count(),
    promissories: await prisma.promissory.count(),
    credits: await prisma.credit.count(),
    invoices: await prisma.invoice.count(),
  }
  
  console.table(counts)
  
  // Verificar relaciones
  const transactionsWithRelations = await prisma.transaction.findFirst({
    include: {
      _count: true
    }
  })
  
  console.log('✅ Muestra de transacción con relaciones:', transactionsWithRelations)
}

verifyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Ejecutar:
```bash
npx ts-node scripts/verify-railway-data.ts
```

## 🛡️ Paso 7: Configurar Shadow Database (Importante para Migraciones)

Railway no crea automáticamente una shadow database. Opciones:

### Opción 1: Crear segunda DB en Railway
1. Agrega otro servicio MySQL en el mismo proyecto
2. Usa esa URL como `SHADOW_DATABASE_URL`

### Opción 2: Usar Base Local como Shadow
```env
DATABASE_URL="mysql://root:PASSWORD@railway.app:PORT/railway"
SHADOW_DATABASE_URL="mysql://root:password@localhost:3306/shadow_db"
```

## 🔄 Paso 8: Sincronización Continua (Opcional)

### Script de Backup Automático

```bash
#!/bin/bash
# scripts/backup-railway.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="railway_backup_${DATE}.sql"

# Variables de Railway
MYSQL_HOST="containers-us-west-XXX.railway.app"
MYSQL_PORT="PORT"
MYSQL_USER="root"
MYSQL_PASS="PASSWORD"
MYSQL_DB="railway"

# Crear backup
mysqldump -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB > backups/$BACKUP_FILE

# Comprimir
gzip backups/$BACKUP_FILE

echo "✅ Backup creado: backups/${BACKUP_FILE}.gz"
```

## ⚡ Paso 9: Optimizaciones para Railway

### 1. Pool de Conexiones
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 2. Variables de Entorno en Railway

En tu proyecto de Railway:
1. Settings → Variables
2. Agregar todas las variables de `.env.example`:

```env
DATABASE_URL=${{MySQL.DATABASE_URL}}
NEXTAUTH_URL=https://tu-app.railway.app
NEXTAUTH_SECRET=genera-uno-seguro
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-secret
ALLOWED_DOMAINS=tudominio.com
MAKE_WEBHOOK_SECRET=tu-webhook-secret
SYNC_INTERVAL_MINUTES=30
VSCONTROL_API_URL=http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx
VSCONTROL_USER=VSControl
VSCONTROL_PASSWORD=vsm1234@
VSCONTROL_EMPRESA=RESPALDO GOVACASA
```

## 🚨 Troubleshooting Común

### Error: "Can't connect to MySQL server"
- Verifica que el puerto esté abierto
- Railway MySQL está en la nube pública por defecto
- Revisa las credenciales

### Error: "Access denied for user"
- Asegúrate de usar las credenciales correctas
- El usuario por defecto es `root`

### Error: "Unknown database"
- La base de datos por defecto se llama `railway`
- No necesitas crear una base de datos adicional

### Error en Migraciones de Prisma
- Configura correctamente `SHADOW_DATABASE_URL`
- Usa `migrate deploy` en producción, no `migrate dev`

## 📊 Monitoreo

Railway proporciona:
- Métricas de uso de CPU/RAM
- Logs en tiempo real
- Alertas de consumo

Ver en: Dashboard → Tu Proyecto → Metrics

## 💰 Costos Estimados

Railway MySQL:
- **Hobby Plan**: $5/mes incluye $5 de créditos
- **Pro Plan**: $20/mes incluye más recursos
- MySQL consume aproximadamente:
  - 512MB RAM: ~$2.50/mes
  - 1GB almacenamiento: ~$0.10/mes

## 🎯 Checklist Final

- [ ] Base de datos creada en Railway
- [ ] Credenciales obtenidas y guardadas
- [ ] Backup local creado
- [ ] Datos importados a Railway
- [ ] Migraciones aplicadas/resueltas
- [ ] Cliente Prisma generado
- [ ] Conexión verificada desde la aplicación
- [ ] Variables de entorno configuradas
- [ ] Shadow database configurada
- [ ] Pruebas de integridad realizadas
- [ ] Backup de Railway creado

## 📚 Referencias

- [Railway Docs - MySQL](https://docs.railway.app/databases/mysql)
- [Prisma - Deploy to Production](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)

## 🆘 Soporte

- Railway Discord: https://discord.gg/railway
- Railway Status: https://railway.instatus.com
- Prisma Discord: https://discord.gg/prisma

---

**Nota**: Guarda siempre múltiples backups antes de realizar migraciones importantes. Railway tiene backups automáticos en el plan Pro.
