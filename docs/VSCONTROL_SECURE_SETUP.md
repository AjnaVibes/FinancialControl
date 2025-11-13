# Configuración Segura de VS Control con IIS

## 🔒 Estrategia de Seguridad Multi-Capa

### 1. Usuario de Base de Datos con Permisos Mínimos

#### A. Crear Usuario de Solo Lectura en SQL Server
```sql
-- Conectarse como administrador a SQL Server
USE master;
GO

-- Crear un login específico para sincronización
CREATE LOGIN VSControlReadOnly 
WITH PASSWORD = 'ContraseñaSegura2024!';
GO

-- Cambiar a la base de datos de VS Control
USE VSControlTotal; -- Cambiar al nombre real de tu BD
GO

-- Crear usuario en la BD
CREATE USER VSControlReadOnly FOR LOGIN VSControlReadOnly;
GO

-- Otorgar SOLO permisos de lectura
GRANT SELECT ON SCHEMA::dbo TO VSControlReadOnly;
GO

-- Opcional: Restringir a tablas específicas
-- GRANT SELECT ON dbo.Clientes TO VSControlReadOnly;
-- GRANT SELECT ON dbo.Ventas TO VSControlReadOnly;
-- GRANT SELECT ON dbo.Productos TO VSControlReadOnly;

-- Denegar permisos de escritura explícitamente
DENY INSERT, UPDATE, DELETE ON SCHEMA::dbo TO VSControlReadOnly;
GO

-- Verificar permisos
SELECT 
    p.permission_name,
    p.state_desc,
    p.class_desc,
    p.major_id,
    OBJECT_NAME(p.major_id) as object_name
FROM sys.database_permissions p
JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
WHERE dp.name = 'VSControlReadOnly';
```

### 2. Configuración de IIS

#### A. Crear Aplicación Web Separada
```xml
<!-- web.config para el servicio SOAP -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.web>
    <!-- Configuración de seguridad -->
    <authentication mode="Windows" />
    <authorization>
      <allow users="DOMAIN\VSControlService" />
      <deny users="*" />
    </authorization>
    
    <!-- Límites de request -->
    <httpRuntime 
      maxRequestLength="4096"
      executionTimeout="60"
      requestValidationMode="2.0" />
    
    <!-- Deshabilitar debug en producción -->
    <compilation debug="false" targetFramework="4.8" />
  </system.web>
  
  <system.webServer>
    <!-- Headers de seguridad -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <remove name="X-Powered-By" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Filtrado de IPs -->
    <security>
      <ipSecurity allowUnlisted="false">
        <!-- Solo permitir tu servidor de aplicación -->
        <add ipAddress="TU_IP_SERVIDOR" allowed="true" />
        <add ipAddress="127.0.0.1" allowed="true" />
      </ipSecurity>
    </security>
  </system.webServer>
  
  <connectionStrings>
    <!-- Usar el usuario de solo lectura -->
    <add name="VSControlDB" 
         connectionString="Data Source=TU_SERVIDOR;Initial Catalog=VSControlTotal;User ID=VSControlReadOnly;Password=ContraseñaSegura2024!;Encrypt=true;TrustServerCertificate=false"
         providerName="System.Data.SqlClient" />
  </connectionStrings>
</configuration>
```

### 3. Implementar API Gateway Intermedio

#### A. Crear un servicio proxy que limite las operaciones
```powershell
# Instalar Application Request Routing (ARR) en IIS
Install-WindowsFeature -Name Web-Server, Web-Common-Http, Web-App-Dev, Web-Net-Ext45, Web-Asp-Net45

# Configurar URL Rewrite y ARR
# Descargar e instalar desde:
# https://www.iis.net/downloads/microsoft/url-rewrite
# https://www.iis.net/downloads/microsoft/application-request-routing
```

### 4. Configuración de Firewall

```powershell
# Solo permitir conexiones desde IPs específicas
New-NetFirewallRule -DisplayName "VSControl SOAP Access" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 83 `
    -RemoteAddress "TU_IP_SERVIDOR" `
    -Action Allow

# Bloquear todo lo demás en ese puerto
New-NetFirewallRule -DisplayName "Block VSControl Others" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 83 `
    -Action Block
```

### 5. Usar HTTPS con Certificado SSL

```powershell
# Generar certificado SSL (en IIS Manager)
# 1. Abrir IIS Manager
# 2. Seleccionar el servidor
# 3. Doble clic en "Server Certificates"
# 4. Click en "Create Self-Signed Certificate" (para pruebas)
# 5. Para producción, usar un certificado válido de CA

# Configurar binding HTTPS
New-WebBinding -Name "VSControlService" `
    -Protocol https `
    -Port 443 `
    -IPAddress "*" `
    -HostHeader "vscontrol.tudominio.com"
```

## 🛡️ Arquitectura de Seguridad Recomendada

```
┌─────────────────┐
│   Tu Aplicación │
│   (Next.js)     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   API Gateway   │ ← Rate Limiting, Auth
│   (IIS ARR)     │
└────────┬────────┘
         │ Internal Network Only
         ▼
┌─────────────────┐
│  VS Control WS  │ ← Usuario Read-Only
│   (IIS)         │
└────────┬────────┘
         │ 
         ▼
┌─────────────────┐
│   SQL Server    │ ← Auditoría activada
│  (VS Control)   │
└─────────────────┘
```

## 🔐 Variables de Entorno Seguras

```env
# .env.local (NO commitear)
VSCONTROL_URL=https://vscontrol-internal.tudominio.local/VSControlTotalWS.asmx
VSCONTROL_USER=VSControlReadOnly
VSCONTROL_PASSWORD=encrypted_password_here
VSCONTROL_CERT_PATH=/path/to/certificate.pem
VSCONTROL_ALLOWED_TABLES=Clientes,Ventas,Productos
VSCONTROL_MAX_RECORDS=10000
VSCONTROL_TIMEOUT=30000
```

## 📊 Monitoreo y Auditoría

### Habilitar auditoría en SQL Server
```sql
-- Crear auditoría
CREATE SERVER AUDIT VSControlAudit
TO FILE (FILEPATH = 'C:\SQLAudit\')
WITH (QUEUE_DELAY = 1000, ON_FAILURE = CONTINUE);
GO

ALTER SERVER AUDIT VSControlAudit WITH (STATE = ON);
GO

-- Crear especificación de auditoría
USE VSControlTotal;
GO

CREATE DATABASE AUDIT SPECIFICATION VSControlAuditSpec
FOR SERVER AUDIT VSControlAudit
ADD (SELECT ON SCHEMA::dbo BY VSControlReadOnly)
WITH (STATE = ON);
GO
```

## 🚨 Alertas y Límites

### Configurar límites de Rate Limiting
```csharp
// En tu servicio web
[WebMethod]
[RateLimit(RequestsPerMinute = 60)]
public DataSet GetTableData(string tableName)
{
    // Validar tabla permitida
    var allowedTables = new[] { "Clientes", "Ventas", "Productos" };
    if (!allowedTables.Contains(tableName))
        throw new UnauthorizedAccessException();
    
    // Limitar registros
    var query = $"SELECT TOP 10000 * FROM {tableName}";
    // ...
}
```

## 📝 Checklist de Seguridad

- [ ] Usuario de BD con permisos mínimos creado
- [ ] Conexión usando HTTPS/TLS
- [ ] Firewall configurado con whitelist de IPs
- [ ] Rate limiting implementado
- [ ] Auditoría de BD activada
- [ ] Logs centralizados configurados
- [ ] Backup de configuración realizado
- [ ] Plan de recuperación documentado
- [ ] Monitoreo de accesos anómalos activo
- [ ] Certificados SSL válidos instalados

## 🔄 Rotación de Credenciales

Implementar rotación automática cada 90 días:

1. Crear script de PowerShell para cambio de contraseña
2. Actualizar automáticamente en Key Vault o secretos
3. Notificar a administradores del cambio
4. Mantener log de rotaciones

## 📞 Contactos de Emergencia

- DBA: _________________
- Seguridad: ___________
- DevOps: ______________
