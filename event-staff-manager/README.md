# Gestión de Personal para Eventos

Sistema de administración de personal para festivales, conciertos y eventos. Permite gestionar trabajadores, asignar turnos por día, calcular pagos en pesos colombianos (COP) y exportar nómina.

## Características (v1)

- **Personal**: agregar, editar y archivar trabajadores (solo nombre obligatorio)
- **Eventos**: un evento activo a la vez, con pestañas por día
- **Turnos**: hora inicio/fin → cálculo automático de horas (incrementos de 30 min)
- **Pagos**: tarifa horaria × horas, en COP; marcar pendiente/pagado
- **Nómina**: resumen por día y evento, exportación CSV
- **Auditoría**: registro de todos los cambios
- **Roles**: Super Admin y Gestor de Día
- **Auth**: inicio de sesión con Google
- **UI**: español, optimizada para móvil

## Requisitos

- Node.js 18+
- Proyecto Firebase con Firestore y Authentication (Google)
- Cuenta de Firebase CLI (`npm install -g firebase-tools`)

## Configuración local

```bash
cd event-staff-manager
npm install
cp .env.example .env
```

Completa `.env` con las credenciales de tu proyecto Firebase (Firebase Console → Configuración del proyecto → Tus apps).

```bash
npm start
```

Si faltan variables de entorno, la app muestra una pantalla de configuración con instrucciones.

## Configuración de Firebase

### 1. Authentication

- Habilitar proveedor **Google**
- En producción, agregar tu dominio de Hosting en **Dominios autorizados**

### 2. Firestore

- Crear base de datos en modo producción
- Vincular proyecto:

```bash
cp .firebaserc.example .firebaserc
# Editar .firebaserc con tu project ID
firebase login
```

- Desplegar reglas e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Primer administrador

El **primer usuario** que inicia sesión con Google se convierte automáticamente en **Super Admin** (mediante documento `meta/bootstrap`). Los siguientes usuarios entran como **Gestor de Día**.

## Estructura de datos (Firestore)

| Colección     | Descripción                    |
|---------------|--------------------------------|
| `meta/bootstrap` | Control de primer admin     |
| `users`       | Perfiles de admin con rol      |
| `staff`       | Directorio de personal         |
| `events`      | Eventos (nombre, venue, fechas)|
| `eventDays`   | Días generados por evento      |
| `assignments` | Turnos por persona por día     |
| `auditLogs`   | Historial de cambios           |

## Roles

| Rol            | Permisos                                              |
|----------------|-------------------------------------------------------|
| Super Admin    | Todo + eliminar eventos + gestionar usuarios + reactivar eventos completados |
| Gestor de Día  | Personal, asignaciones, pagos, auditoría, archivar personal |

## Decisiones confirmadas

| Tema | Configuración |
|------|---------------|
| Zona horaria | Colombia (`America/Bogota`) |
| Sin tarifa | No se puede asignar turno |
| Eventos completados | Solo lectura; Super Admin reactiva |
| Historial | Todos los eventos + nómina + CSV |
| Pagos en lote | Transacción atómica por día |

## Despliegue en producción

```bash
npm run build
firebase deploy
```

Esto despliega Hosting + reglas Firestore. Tras el deploy:

1. Copia la URL de Hosting (ej. `https://tu-proyecto.web.app`)
2. Agrégala en Firebase Console → Authentication → Dominios autorizados
3. Inicia sesión con Google desde esa URL

## Flujo de trabajo

1. **Personal** → Agregar trabajadores con tarifa por hora (COP)
2. **Evento** → Crear festival (fechas inicio/fin) → se activa automáticamente
3. Por cada **día** → Asignar personal con hora inicio/fin
4. Revisar pago calculado → Marcar **Pagado**
5. **Nómina** → Exportar CSV para contabilidad
6. Al terminar → **Completar** evento (queda en solo lectura)

## Próximas versiones (v2)

Horas extra, login de personal, multi-venue, plantillas de crew, reportes PDF, verificación de antecedentes.

## Licencia

MIT
