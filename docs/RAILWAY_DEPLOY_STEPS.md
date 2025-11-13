# 🚂 PASOS PARA DEPLOY EN RAILWAY - Tu Proyecto FinancialControl

## ✅ Archivos Ya Configurados

Ya tienes todo listo para el deploy:
- ✅ `.gitignore` actualizado
- ✅ `package.json` con build script para Prisma
- ✅ `railway.json` configurado
- ✅ Scripts de migración preparados

## 📋 PASOS A SEGUIR

### PASO 1: Preparar tu código para Git

```bash
# 1. Verificar que .env NO esté en git
git status
# Si ves .env en rojo o verde, ejecuta:
git rm --cached .env

# 2. Agregar todos los cambios
git add .

# 3. Hacer commit
git commit -m "Configuración para Railway deploy"

# 4. Push a GitHub (si no tienes repo, créalo primero)
git push origin main
```

### PASO 2: Configurar en Railway Dashboard

Ya que iniciaste sesión con tu cuenta de GitHub en Railway:

1. **Crear nuevo proyecto:**
   - Ve a [railway.app/new](https://railway.app/new)
   - Click en "Deploy from GitHub repo"
   - Selecciona tu repositorio `FinancialControl`

2. **Agregar MySQL:**
   - En tu proyecto, click "New Service"
   - Selecciona "Database" → "MySQL"
   - Railway creará el servicio automáticamente

3. **Copiar credenciales MySQL:**
   - Click en el servicio MySQL
   - Ve a "Variables"
   - Copia estos valores (los necesitarás):
     - `MYSQL_URL`
     - `MYSQLHOST` 
     - `MYSQLPORT`
     - `MYSQLDATABASE`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`

### PASO 3: Configurar Variables de Entorno

En Railway Dashboard → Tu App → Variables → "RAW Editor", pega esto y actualiza con tus valores:

```env
# Railway genera esta automáticamente (NO la cambies)
DATABASE_URL=${{MySQL.DATABASE_URL}}

# Agrega estas manualmente:
NEXTAUTH_URL=https://tu-app.up.railway.app
NEXTAUTH_SECRET=genera-uno-con-openssl-rand-base64-32
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-secret
ALLOWED_DOMAINS=tudominio.com
MAKE_WEBHOOK_SECRET=tu-webhook-secret
SYNC_INTERVAL_MINUTES=30
VSCONTROL_API_URL=http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx
VSCONTROL_USER=VSControl
VSCONTROL_PASSWORD=vsm1234@
VSCONTROL_EMPRESA=RESPALDO GOVACASA
```

**Para generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### PASO 4: Deploy Inicial

Railway detectará automáticamente el push y comenzará el deploy.

Verifica el progreso:
- Railway Dashboard → Tu Proyecto → "Deployments"
- Espera a que aparezca "Success" ✅

### PASO 5: Aplicar Migraciones de Prisma

Una vez que el deploy inicial esté completo:

```bash
# Instala Railway CLI si no lo tienes
npm install -g @railway/cli

# Login
railway login

# Link tu proyecto (selecciona tu proyecto cuando te pregunte)
railway link

# Aplicar migraciones
railway run npx prisma migrate deploy
```

Si tienes errores de migración, marca las migraciones como aplicadas:
```bash
railway run npx prisma migrate resolve --applied "20251012042126_init"
railway run npx prisma migrate resolve --applied "20251012180454_add_clients_table"
railway run npx prisma migrate resolve --applied "20251012181009_add_sync_tables"
railway run npx prisma migrate resolve --applied "20251013023934_add_multicompany_system"
railway run npx prisma migrate resolve --applied "20251022160629_add_ramp_tables"
railway run npx prisma migrate resolve --applied "20251031023249_remove_working_time_fields"
railway run npx prisma migrate resolve --applied "20251031054350_fix_client_id_remove_autoincrement"
railway run npx prisma migrate resolve --applied "20251111054821_add_credit_tables"
railway run npx prisma migrate resolve --applied "20251111055934_add_invoices_table"
railway run npx prisma migrate resolve --applied "20251112202409_add_vscontrol_tables"
```

### PASO 6: Migrar Datos Locales

**IMPORTANTE**: Los datos no se suben por Git. Debes migrarlos manualmente:

#### Opción A: Usar el script interactivo (RECOMENDADO)

```bash
# Ejecutar desde tu proyecto local
npx ts-node scripts/migrate-to-railway.ts

# El script te pedirá:
# 1. Credenciales locales (tu MySQL local)
# 2. Credenciales de Railway (las que copiaste en Paso 2)
# 3. Selecciona opción 1: Exportar backup completo
# 4. Selecciona opción 4: Importar a Railway
```

#### Opción B: Manual con mysqldump

```bash
# 1. Exportar tu BD local (ajusta el nombre de tu BD)
mysqldump -u root -p tu_bd_local > backup.sql

# 2. Importar a Railway (usa las credenciales del Paso 2)
mysql -h containers-us-west-XXX.railway.app -P 7XXX -u root -pPASSWORD railway < backup.sql
```

### PASO 7: Verificar el Deploy

1. **Verificar la aplicación:**
   - Ve a Railway Dashboard
   - Click en tu servicio de app
   - Click en el dominio generado (algo como `tu-app.up.railway.app`)

2. **Verificar datos migrados:**
   ```bash
   # Desde tu local
   railway run npx prisma studio
   # Se abrirá Prisma Studio conectado a Railway
   ```

3. **Verificar logs:**
   ```bash
   railway logs
   ```

## 🔧 Solución de Problemas

### Error: "Can't connect to MySQL"
- Verifica que MySQL esté activo en Railway (debe mostrar "Active")
- Revisa que `DATABASE_URL` esté configurada correctamente

### Error: "Prisma schema not found"
- Verifica que `prisma generate` se ejecute en el build
- El `package.json` ya está configurado correctamente

### Error: "Migration failed"
- Usa los comandos `migrate resolve --applied` del Paso 5
- Asegúrate de que la BD de Railway esté vacía antes de migrar

### Datos no aparecen
- Los datos se migran DESPUÉS del deploy
- Ejecuta el Paso 6 completamente

## 📊 Verificación Final

Ejecuta este checklist:

```bash
# 1. Verificar conexión a BD
railway run npx prisma db pull

# 2. Contar registros
railway run npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  console.log('Users:', await prisma.user.count());
  console.log('Clients:', await prisma.client.count());
  console.log('Projects:', await prisma.project.count());
  await prisma.\$disconnect();
}
check();
"

# 3. Ver logs en tiempo real
railway logs --tail
```

## 🎉 ¡LISTO!

Tu aplicación debería estar funcionando en:
```
https://[tu-app].up.railway.app
```

## 📝 Comandos Útiles Post-Deploy

```bash
# Ver logs
railway logs

# Ejecutar comandos en producción
railway run [comando]

# Abrir consola MySQL
railway run mysql

# Ejecutar migraciones futuras
railway run npx prisma migrate deploy

# Reiniciar servicio
railway restart
```

## 🔄 Para Futuros Cambios

1. Hacer cambios locales
2. Commit y push a GitHub
3. Railway detecta y hace deploy automático
4. Si hay cambios en BD: `railway run npx prisma migrate deploy`

---

**Nota**: Guarda las credenciales de Railway en un lugar seguro. No las subas a Git.
