import * as bcrypt from "bcryptjs";

const RONDAS_BCRYPT = 10;
const MINUTOS_VALIDEZ = 15;

export interface CodigoRecuperacion {
  codigo: string;
  hash: string;
  expira: Date;
}

/** Código de 6 dígitos, igual de simple que el OTP que ya simulaba el login viejo por SMS. */
export async function generarCodigoRecuperacion(): Promise<CodigoRecuperacion> {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(codigo, RONDAS_BCRYPT);
  const expira = new Date(Date.now() + MINUTOS_VALIDEZ * 60_000);
  return { codigo, hash, expira };
}

export function codigoVencido(expira: Date | string | null): boolean {
  if (!expira) return true;
  return new Date(expira).getTime() < Date.now();
}

/**
 * "Envío" de desarrollo: hasta que exista un proveedor de correo real (sección 14.2 del doc
 * maestro), el código se deja en el log del servidor. Nunca se devuelve en la respuesta HTTP —
 * eso sería filtrar el código a cualquiera que solo conozca el correo de la víctima.
 */
export function logCodigoDesarrollo(destinatario: string, codigo: string) {
  // eslint-disable-next-line no-console
  console.log(`[DEV] Código de recuperación para ${destinatario}: ${codigo} (válido 15 min)`);
}
