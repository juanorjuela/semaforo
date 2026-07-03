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

## Configuración

1. Instalar dependencias:

```bash
cd event-staff-manager
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env
```

3. Completar `.env` con las credenciales de tu proyecto Firebase.

4. En Firebase Console:
   - Habilitar **Authentication → Google**
   - Crear base de datos **Firestore**
   - Desplegar reglas e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. Iniciar en desarrollo:

```bash
npm start
```

## Estructura de datos (Firestore)

| Colección    | Descripción                          |
|-------------|--------------------------------------|
| `users`     | Perfiles de admin con rol            |
| `staff`     | Directorio de personal               |
| `events`    | Eventos (nombre, venue, fechas)      |
| `eventDays` | Días generados por evento            |
| `assignments` | Turnos por persona por día         |
| `auditLogs` | Historial de cambios                 |

## Roles

| Rol            | Permisos                                              |
|----------------|-------------------------------------------------------|
| Super Admin    | Todo + eliminar eventos + gestionar usuarios          |
| Gestor de Día  | Personal, asignaciones, pagos, auditoría (lectura)    |

El primer usuario que inicia sesión se convierte automáticamente en Super Admin.

## Próximas versiones (v2)

Según tus respuestas, quedan para v2: horas extra, login de personal, multi-venue, plantillas de crew, reportes PDF, y flujo de verificación de antecedentes.

## Licencia

MIT
