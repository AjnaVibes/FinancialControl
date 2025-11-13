# scripts/setup-iis-secure.ps1
# Script de PowerShell para configurar IIS de forma segura para VS Control
# EJECUTAR COMO ADMINISTRADOR

param(
    [string]$ServerIP = "TU_IP_SERVIDOR",
    [string]$AppServerIP = "TU_IP_APP_SERVER",
    [string]$VSControlPath = "C:\inetpub\wwwroot\VSControlTotalWS",
    [string]$BackupPath = "C:\Backups\IIS",
    [switch]$TestMode = $false
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Configuración Segura de IIS para VS Control   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar permisos de administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script debe ejecutarse como Administrador" -ForegroundColor Red
    exit 1
}

# Función para crear backup
function Create-Backup {
    param([string]$BackupDir)
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$BackupDir\IIS_Config_$timestamp.xml"
    
    Write-Host "📦 Creando backup de configuración IIS..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    # Exportar configuración de IIS
    & "$env:windir\system32\inetsrv\appcmd.exe" add backup "VSControl_$timestamp"
    
    Write-Host "✅ Backup creado: VSControl_$timestamp" -ForegroundColor Green
}

# Función para instalar características de IIS
function Install-IISFeatures {
    Write-Host "📦 Instalando características de IIS..." -ForegroundColor Yellow
    
    $features = @(
        "IIS-WebServerRole",
        "IIS-WebServer",
        "IIS-CommonHttpFeatures",
        "IIS-HttpErrors",
        "IIS-HttpRedirect",
        "IIS-ApplicationDevelopment",
        "IIS-NetFxExtensibility45",
        "IIS-HealthAndDiagnostics",
        "IIS-HttpLogging",
        "IIS-Security",
        "IIS-RequestFiltering",
        "IIS-IPSecurity",
        "IIS-Performance",
        "IIS-WebServerManagementTools",
        "IIS-ManagementConsole",
        "IIS-IIS6ManagementCompatibility",
        "IIS-Metabase",
        "IIS-ASPNET45"
    )
    
    foreach ($feature in $features) {
        Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart | Out-Null
        Write-Host "  ✓ $feature instalado" -ForegroundColor Gray
    }
    
    Write-Host "✅ Características de IIS instaladas" -ForegroundColor Green
}

# Función para configurar el Application Pool
function Configure-AppPool {
    param([string]$PoolName = "VSControlSecurePool")
    
    Write-Host "🔧 Configurando Application Pool..." -ForegroundColor Yellow
    
    Import-Module WebAdministration
    
    # Crear Application Pool si no existe
    if (-not (Test-Path "IIS:\AppPools\$PoolName")) {
        New-WebAppPool -Name $PoolName
    }
    
    # Configurar el pool con mejores prácticas de seguridad
    $appPool = Get-Item "IIS:\AppPools\$PoolName"
    $appPool.processIdentity.identityType = "ApplicationPoolIdentity"
    $appPool.enable32BitAppOnWin64 = $false
    $appPool.managedRuntimeVersion = "v4.0"
    $appPool.startMode = "AlwaysRunning"
    $appPool.recycling.periodicRestart.time = [TimeSpan]::FromHours(3)
    $appPool | Set-Item
    
    # Configurar límites
    Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name recycling.periodicRestart.memory -Value 512000
    Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name recycling.periodicRestart.privateMemory -Value 1024000
    Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(20))
    Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name processModel.maxProcesses -Value 1
    
    Write-Host "✅ Application Pool configurado: $PoolName" -ForegroundColor Green
}

# Función para configurar el sitio web
function Configure-Website {
    param(
        [string]$SiteName = "VSControlSecure",
        [string]$PhysicalPath,
        [string]$PoolName = "VSControlSecurePool"
    )
    
    Write-Host "🌐 Configurando sitio web..." -ForegroundColor Yellow
    
    Import-Module WebAdministration
    
    # Crear sitio si no existe
    if (-not (Get-Website -Name $SiteName -ErrorAction SilentlyContinue)) {
        New-Website -Name $SiteName `
                   -Port 8443 `
                   -PhysicalPath $PhysicalPath `
                   -ApplicationPool $PoolName `
                   -Ssl
    }
    
    # Configurar autenticación
    Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/anonymousAuthentication" `
                                 -Name enabled `
                                 -Value $false `
                                 -PSPath "IIS:\Sites\$SiteName"
    
    Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/windowsAuthentication" `
                                 -Name enabled `
                                 -Value $true `
                                 -PSPath "IIS:\Sites\$SiteName"
    
    Write-Host "✅ Sitio web configurado: $SiteName" -ForegroundColor Green
}

# Función para configurar restricciones de IP
function Configure-IPRestrictions {
    param(
        [string]$SiteName = "VSControlSecure",
        [string[]]$AllowedIPs
    )
    
    Write-Host "🔒 Configurando restricciones de IP..." -ForegroundColor Yellow
    
    # Habilitar restricciones de IP
    Set-WebConfigurationProperty -Filter "/system.webServer/security/ipSecurity" `
                                 -Name allowUnlisted `
                                 -Value $false `
                                 -PSPath "IIS:\Sites\$SiteName"
    
    # Agregar IPs permitidas
    foreach ($ip in $AllowedIPs) {
        Add-WebConfigurationProperty -Filter "/system.webServer/security/ipSecurity" `
                                    -Name "." `
                                    -Value @{ipAddress=$ip; allowed=$true} `
                                    -PSPath "IIS:\Sites\$SiteName"
        Write-Host "  ✓ IP permitida: $ip" -ForegroundColor Gray
    }
    
    Write-Host "✅ Restricciones de IP configuradas" -ForegroundColor Green
}

# Función para configurar Request Filtering
function Configure-RequestFiltering {
    param([string]$SiteName = "VSControlSecure")
    
    Write-Host "🛡️ Configurando Request Filtering..." -ForegroundColor Yellow
    
    # Configurar límites de request
    Set-WebConfigurationProperty -Filter "/system.webServer/security/requestFiltering/requestLimits" `
                                 -Name maxAllowedContentLength `
                                 -Value 10485760 `
                                 -PSPath "IIS:\Sites\$SiteName"
    
    Set-WebConfigurationProperty -Filter "/system.webServer/security/requestFiltering/requestLimits" `
                                 -Name maxQueryString `
                                 -Value 2048 `
                                 -PSPath "IIS:\Sites\$SiteName"
    
    Set-WebConfigurationProperty -Filter "/system.webServer/security/requestFiltering/requestLimits" `
                                 -Name maxUrl `
                                 -Value 4096 `
                                 -PSPath "IIS:\Sites\$SiteName"
    
    # Bloquear verbos HTTP peligrosos
    $deniedVerbs = @("DELETE", "PUT", "TRACE", "OPTIONS")
    foreach ($verb in $deniedVerbs) {
        Add-WebConfigurationProperty -Filter "/system.webServer/security/requestFiltering/verbs" `
                                    -Name "." `
                                    -Value @{verb=$verb; allowed=$false} `
                                    -PSPath "IIS:\Sites\$SiteName"
    }
    
    Write-Host "✅ Request Filtering configurado" -ForegroundColor Green
}

# Función para configurar headers de seguridad
function Configure-SecurityHeaders {
    param([string]$SiteName = "VSControlSecure")
    
    Write-Host "📋 Configurando headers de seguridad..." -ForegroundColor Yellow
    
    $headers = @{
        "X-Content-Type-Options" = "nosniff"
        "X-Frame-Options" = "DENY"
        "X-XSS-Protection" = "1; mode=block"
        "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
        "Content-Security-Policy" = "default-src 'self'"
        "Referrer-Policy" = "strict-origin-when-cross-origin"
    }
    
    foreach ($header in $headers.GetEnumerator()) {
        Set-WebConfigurationProperty -Filter "/system.webServer/httpProtocol/customHeaders" `
                                    -Name "." `
                                    -Value @{name=$header.Key; value=$header.Value} `
                                    -PSPath "IIS:\Sites\$SiteName"
        Write-Host "  ✓ $($header.Key): $($header.Value)" -ForegroundColor Gray
    }
    
    # Remover headers que revelan información
    Remove-WebConfigurationProperty -Filter "/system.webServer/httpProtocol/customHeaders" `
                                   -Name "." `
                                   -AtElement @{name="X-Powered-By"} `
                                   -PSPath "IIS:\Sites\$SiteName" `
                                   -ErrorAction SilentlyContinue
    
    Remove-WebConfigurationProperty -Filter "/system.webServer/httpProtocol/customHeaders" `
                                   -Name "." `
                                   -AtElement @{name="Server"} `
                                   -PSPath "IIS:\Sites\$SiteName" `
                                   -ErrorAction SilentlyContinue
    
    Write-Host "✅ Headers de seguridad configurados" -ForegroundColor Green
}

# Función para configurar logging
function Configure-Logging {
    param([string]$SiteName = "VSControlSecure")
    
    Write-Host "📝 Configurando logging..." -ForegroundColor Yellow
    
    Set-WebConfigurationProperty -Filter "/system.applicationHost/sites/site[@name='$SiteName']/logFile" `
                                 -Name logFormat `
                                 -Value "W3C"
    
    Set-WebConfigurationProperty -Filter "/system.applicationHost/sites/site[@name='$SiteName']/logFile" `
                                 -Name directory `
                                 -Value "C:\inetpub\logs\VSControl"
    
    Set-WebConfigurationProperty -Filter "/system.applicationHost/sites/site[@name='$SiteName']/logFile" `
                                 -Name period `
                                 -Value "Daily"
    
    # Habilitar campos de log adicionales
    $logFields = @(
        "Date", "Time", "ClientIP", "UserName", "ServerIP", 
        "Method", "UriStem", "UriQuery", "HttpStatus", 
        "Win32Status", "TimeTaken", "ServerPort", "UserAgent", 
        "Referer", "Host"
    )
    
    Set-WebConfigurationProperty -Filter "/system.applicationHost/sites/site[@name='$SiteName']/logFile" `
                                 -Name logExtFileFlags `
                                 -Value ($logFields -join ",")
    
    Write-Host "✅ Logging configurado" -ForegroundColor Green
}

# Función para configurar el firewall
function Configure-Firewall {
    param(
        [string]$RuleName = "VSControl Secure Access",
        [string[]]$AllowedIPs,
        [int]$Port = 8443
    )
    
    Write-Host "🔥 Configurando firewall..." -ForegroundColor Yellow
    
    # Eliminar regla existente si existe
    Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    
    # Crear nueva regla para IPs permitidas
    New-NetFirewallRule -DisplayName $RuleName `
                       -Direction Inbound `
                       -Protocol TCP `
                       -LocalPort $Port `
                       -RemoteAddress $AllowedIPs `
                       -Action Allow `
                       -Profile Any
    
    # Crear regla de bloqueo para el resto
    New-NetFirewallRule -DisplayName "$RuleName - Block Others" `
                       -Direction Inbound `
                       -Protocol TCP `
                       -LocalPort $Port `
                       -Action Block `
                       -Profile Any `
                       -Priority 100
    
    Write-Host "✅ Firewall configurado" -ForegroundColor Green
}

# Función principal
function Main {
    Write-Host ""
    Write-Host "🚀 Iniciando configuración segura..." -ForegroundColor Cyan
    Write-Host ""
    
    if ($TestMode) {
        Write-Host "⚠️  MODO DE PRUEBA - No se aplicarán cambios" -ForegroundColor Yellow
        return
    }
    
    # Crear backup
    Create-Backup -BackupDir $BackupPath
    
    # Instalar características
    Install-IISFeatures
    
    # Configurar Application Pool
    Configure-AppPool
    
    # Configurar Website
    Configure-Website -PhysicalPath $VSControlPath
    
    # Configurar restricciones de IP
    $allowedIPs = @($AppServerIP, "127.0.0.1", "::1")
    Configure-IPRestrictions -AllowedIPs $allowedIPs
    
    # Configurar Request Filtering
    Configure-RequestFiltering
    
    # Configurar headers de seguridad
    Configure-SecurityHeaders
    
    # Configurar logging
    Configure-Logging
    
    # Configurar firewall
    Configure-Firewall -AllowedIPs $allowedIPs
    
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "   ✅ Configuración completada exitosamente      " -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📌 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "  1. Configurar certificado SSL válido" -ForegroundColor White
    Write-Host "  2. Actualizar las IPs permitidas con valores reales" -ForegroundColor White
    Write-Host "  3. Crear usuario de solo lectura en SQL Server" -ForegroundColor White
    Write-Host "  4. Configurar monitoreo y alertas" -ForegroundColor White
    Write-Host "  5. Probar la configuración en ambiente de prueba" -ForegroundColor White
    Write-Host ""
}

# Ejecutar
Main
