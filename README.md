# Semáforos de Igualdad

Un juego educativo de preguntas y respuestas sobre igualdad y derechos humanos.

## Descripción

Semáforos de Igualdad es un juego de cartas digital que ayuda a aprender sobre igualdad y derechos humanos de una manera divertida e interactiva. El juego utiliza un sistema de semáforo (rojo, amarillo, verde) para representar diferentes niveles de dificultad.

### Reglas del Juego

1. **Cartas Rojas (Fácil)**
   - El jugador necesita coleccionar 3 cartas rojas para desbloquear las cartas amarillas
   - Preguntas de nivel básico

2. **Cartas Amarillas (Medio)**
   - Se necesitan 2 cartas amarillas para desbloquear las cartas verdes
   - Preguntas de nivel intermedio
   - Se desbloquean después de obtener 3 cartas rojas

3. **Cartas Verdes (Difícil)**
   - Una carta verde correcta gana el juego
   - Preguntas de nivel avanzado
   - Se desbloquean después de obtener 2 cartas amarillas

### Características

- Sistema de cartas con preguntas y respuestas
- Animación de volteo de cartas
- Sistema de pistas (primera y última letra de la respuesta)
- Verificación flexible de respuestas
- Panel de administración para gestionar preguntas
- Tabla de campeones

## Tecnologías Utilizadas

- React con TypeScript
- Firebase (Base de datos y hosting)
- Tailwind CSS para estilos
- Framer Motion para animaciones
- React Card Flip para animaciones de cartas
- Fuse.js para comparación flexible de respuestas

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL del repositorio]
```

2. Instalar dependencias:
```bash
cd semaforos-igualdad
npm install
```

3. Configurar Firebase:
   - Crear un proyecto en Firebase
   - Copiar las credenciales de configuración
   - Crear un archivo `.env` con las variables de entorno necesarias

4. Iniciar el servidor de desarrollo:
```bash
npm start
```

## Uso

### Modo Jugador
- Accede a la aplicación
- Comienza con las cartas rojas
- Responde preguntas para avanzar
- Usa pistas si necesitas ayuda
- ¡Gana el juego respondiendo una carta verde!

### Modo Administrador
- Accede al panel de administración
- Agrega, edita o elimina preguntas
- Asigna colores a las preguntas según su dificultad

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir los cambios que te gustaría hacer.

## Licencia

Este proyecto está bajo la Licencia MIT. 