// Valores de repuesto que existían antes solo como fallback en las estrategias JWT
// (jwt.strategy.ts / jwt-vecino.strategy.ts) — si alguna vez llegan a usarse de verdad,
// cualquiera que lea el código fuente podría forjar un token válido. Ver hallazgo #1 en
// docs/tecnica/11-plan-seguridad.md.
const SECRETOS_DE_REPUESTO = new Set(["cambiar-en-produccion", "cambiar-en-produccion-vecino"]);
const LONGITUD_MINIMA = 32;

/**
 * Corta el arranque del servidor si los secretos de JWT no están configurados como
 * corresponde. Antes de este chequeo, un despliegue mal configurado (variable de entorno
 * olvidada) arrancaba igual usando un secreto de repuesto escrito en el propio código —
 * en vez de fallar de forma ruidosa, fallaba en silencio dejando la puerta abierta.
 */
export function validarEntorno(): void {
  const errores: string[] = [];

  for (const [nombre, valor] of [
    ["JWT_SECRET", process.env.JWT_SECRET],
    ["JWT_SECRET_VECINO", process.env.JWT_SECRET_VECINO],
  ] as const) {
    if (!valor) {
      errores.push(`Falta la variable de entorno ${nombre}.`);
    } else if (valor.length < LONGITUD_MINIMA) {
      errores.push(`${nombre} debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
    } else if (SECRETOS_DE_REPUESTO.has(valor)) {
      errores.push(`${nombre} sigue con el valor de repuesto — genera uno real (openssl rand -hex 32).`);
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET === process.env.JWT_SECRET_VECINO) {
    errores.push("JWT_SECRET y JWT_SECRET_VECINO no pueden ser el mismo valor — son sistemas de token separados a propósito.");
  }

  if (errores.length > 0) {
    // eslint-disable-next-line no-console
    console.error("No se puede arrancar la API: configuración de seguridad inválida.\n" + errores.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
}
