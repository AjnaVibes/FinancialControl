# 📋 Guía de Configuración - VS Control Integration

## 🔧 Requisitos Previos

1. **Credenciales de VS Control**: Necesitas obtener del administrador de VS Control:
   - Usuario de acceso
   - Contraseña
   - Código de empresa

2. **Base de datos MySQL**: Las tablas ya están creadas en tu sistema

## 📝 Paso 1: Configuración de Variables de Entorno

Crea o edita tu archivo `.env` en la raíz del proyecto y agrega estas líneas:

```env
# VS Control API Configuration
VSCONTROL_API_URL=http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx
VSCONTROL_USER=tu_usuario_real
VSCONTROL_PASSWORD=tu_password_real
VSCONTROL_EMPRESA=tu_codigo_empresa
```

⚠️ **IMPORTANTE**: Reemplaza `tu_usuario_real`, `tu_password_real` y `tu_codigo_empresa` con las credenciales proporcionadas por el administrador de VS Control.

## 🔍 Paso 2: Verificar Configuración

Ejecuta el siguiente comando para verificar tu configuración:

```bash
npx tsx scripts/test-vscontrol-connection.ts
```

Este script verificará:
- ✅ Que las variables de entorno estén configuradas
- ✅ Que el servidor VS Control sea accesible
- ✅ Información sobre las tablas disponibles

## 🚀 Paso 3: Probar Sincronización

Una vez configuradas las credenciales correctas, prueba la sincronización:

```bash
npx tsx scripts/test-vscontrol-sync.ts
```

Este script intentará:
1. Conectarse a VS Control
2. Sincronizar todas las tablas configuradas
3. Mostrar el progreso y resultados

## 📊 Tablas Disponibles

La integración sincroniza las siguientes tablas desde VS Control:

| Tabla | Descripción | Prioridad | Dependencias |
|-------|-------------|-----------|--------------|
| `vsc_empresas` | Catálogo de empresas | 1 | Ninguna |
| `vsc_proyectos` | Proyectos inmobiliarios | 2 | Ninguna |
| `vsc_clientes` | Base de clientes | 3 | Ninguna |
| `vsc_viviendas` | Inventario de viviendas | 4 | vsc_proyectos |
| `vsc_cliente_vivienda` | Asignación cliente-vivienda | 5 | vsc_clientes, vsc_viviendas |
| `vsc_avances_fisicos` | Avances de obra | 5 | vsc_viviendas |
| `vsc_ordenes_compra` | Órdenes de compra | 3 | Ninguna |
| `vsc_control_documentos` | Control documental | 5 | vsc_viviendas, vsc_clientes |

## 🔄 Uso de la API

### Sincronizar una tabla específica

```bash
curl -X POST http://localhost:3000/api/vscontrol/sync \
  -H "Content-Type: application/json" \
  -d '{"tableName": "vsc_empresas"}'
```

### Ver estado de sincronización

```bash
curl http://localhost:3000/api/vscontrol/sync
```

## 🛠️ Solución de Problemas

### Error: "El servidor no reconoció el valor del encabezado HTTP SOAPAction"

**Causa**: Credenciales incorrectas o formato incorrecto del SOAP request.

**Solución**: 
1. Verifica que las credenciales sean correctas
2. Confirma con el administrador de VS Control que tu usuario tenga permisos

### Error: "No se pudo iniciar sesión en VS Control"

**Causa**: Las credenciales no son válidas o el usuario no tiene permisos.

**Solución**:
1. Verifica las credenciales en tu archivo `.env`
2. Asegúrate de que no haya espacios adicionales
3. Confirma con el administrador que tu usuario esté activo

### Error: "Cannot connect to VS Control API"

**Causa**: El servidor VS Control no es accesible desde tu red.

**Solución**:
1. Verifica tu conexión a internet
2. Confirma que no haya un firewall bloqueando la conexión
3. Prueba acceder directamente: http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx

## 📚 Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `test-vscontrol-connection.ts` | Verifica configuración y conexión | `npx tsx scripts/test-vscontrol-connection.ts` |
| `test-vscontrol-sync.ts` | Prueba sincronización completa | `npx tsx scripts/test-vscontrol-sync.ts` |
| `explore-vscontrol-api.ts` | Explora métodos disponibles del API | `npx tsx scripts/explore-vscontrol-api.ts` |
| `init-vscontrol-tables.ts` | Verifica tablas en base de datos | `npx tsx scripts/init-vscontrol-tables.ts` |

## 📖 Arquitectura

```
┌─────────────────┐     SOAP/XML      ┌──────────────────┐
│   VS Control    │ ◄──────────────►  │  Your System     │
│   SQL Server    │                    │  MySQL Database  │
└─────────────────┘                    └──────────────────┘
                                               │
                                               ▼
                                       ┌──────────────────┐
                                       │  Next.js App     │
                                       │  Admin Panel     │
                                       └──────────────────┘
```

## 🤝 Contacto y Soporte

Si necesitas ayuda adicional:

1. **Credenciales**: Contacta al administrador de VS Control
2. **Problemas técnicos**: Revisa los logs en la consola
3. **Documentación API**: Los métodos SOAP están documentados en el servicio

## ✅ Checklist de Configuración

- [ ] Obtener credenciales de VS Control
- [ ] Configurar variables en `.env`
- [ ] Verificar conexión con `test-vscontrol-connection.ts`
- [ ] Probar sincronización con `test-vscontrol-sync.ts`
- [ ] Verificar datos en Prisma Studio: `npx prisma studio`
- [ ] Configurar sincronización automática (opcional)

---

💡 **Nota**: Esta integración está diseñada para sincronizar datos unidireccionalmente desde VS Control hacia tu base de datos local. Los cambios en tu base de datos local NO se reflejarán en VS Control.
