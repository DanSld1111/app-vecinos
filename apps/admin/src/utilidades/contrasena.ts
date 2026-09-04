const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function bloque(longitud: number): string {
  let resultado = "";
  for (let i = 0; i < longitud; i++) {
    resultado += LETRAS[Math.floor(Math.random() * LETRAS.length)];
  }
  return resultado;
}

/** Contraseña temporal generada en el cliente y enviada al crear la cuenta o restablecer su clave — se muestra una sola vez. */
export function generarContrasenaTemporal(): string {
  return `${bloque(3)}-${bloque(4)}-${bloque(2)}`;
}
