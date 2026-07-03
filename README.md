# Ecoguardianas

Sistema de gestión de personal para festivales, conciertos y eventos en vivo. Administra trabajadores, turnos diarios, horas y pagos en pesos colombianos (COP).

## Características

- Directorio de personal (agregar, editar, archivar)
- Eventos con pestañas por día
- Turnos con hora inicio/fin → cálculo automático de horas y pago
- Seguimiento de pagos (pendiente / pagado) y exportación CSV
- Registro de auditoría
- Roles: Super Admin y Gestor de Día
- Inicio de sesión con Google
- Interfaz en español, optimizada para móvil

## Requisitos

- Node.js 18+
- Proyecto Firebase **Ecoguardianas** con Firestore y Google Auth

## Configuración local

```bash
npm install
cp .env.example .env
npm start
```

## Firebase

Proyecto: **ecoguardianas**

1. Habilitar **Authentication → Google**
2. Crear **Firestore** (región us-east1 recomendada para Colombia)
3. Publicar reglas (`firestore.rules`) e índices (`firestore.indexes.json`)
4. Dominios autorizados: `localhost`, `ecoguardianas.web.app`, `ecoguardianas.firebaseapp.com`

El primer usuario que inicia sesión con Google se convierte en **Super Admin**.

## Despliegue

```bash
firebase login
npm run deploy
```

O automático vía GitHub Actions (secret `FIREBASE_SERVICE_ACCOUNT_ECOGUARDIANAS`).

### URLs en producción

- https://ecoguardianas.web.app
- https://ecoguardianas.firebaseapp.com

## Colecciones Firestore

`meta/bootstrap`, `users`, `staff`, `events`, `eventDays`, `assignments`, `auditLogs`

## Licencia

MIT
