export function getFirebaseErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    if (code === 'permission-denied') {
      return 'Sin permiso. Cierra sesión e inicia de nuevo.';
    }
    if (code === 'failed-precondition') {
      return 'Índices de Firebase en proceso. Espera 1–2 minutos e intenta de nuevo.';
    }
    if (code === 'unavailable') {
      return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
    }
    if (code === 'invalid-argument') {
      return 'Datos inválidos al guardar. Solo el nombre es obligatorio; deja los demás campos vacíos si no aplican.';
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message: string }).message);
    if (message.includes('undefined')) {
      return 'Error al guardar campos vacíos. Actualiza la página e intenta de nuevo.';
    }
  }
  return fallback;
}
