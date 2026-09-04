# 0010 — Registro de vecinos por correo y clave (en vez de teléfono + SMS)

## Contexto

El diseño original de Etapa 1 (`FlujoLogin.tsx`) simulaba un login por teléfono + código SMS,
puramente de interfaz — no hay servicio de SMS contratado ni previsto todavía. El usuario pidió
reemplazar ese flujo por un registro real (correo + clave), manteniendo "Continuar con Google"
como próximamente y el modo invitado.

## Decisiones

**`UsuarioApp` gana un campo `correo` obligatorio y único** en `paquetes/tipos/src/usuario.ts` y en
`usuarios_app` (migración `0007`, editada directamente — no había ningún dato real fuera de esta
base de desarrollo, así que no correspondía la ceremonia de una migración `ALTER` separada con
columna nullable y backfill). `telefono` se mantiene como dato de perfil, ya no como mecanismo de
autenticación.

**Autenticación de vecinos separada por completo de la de `cuentas`** (panel admin): nueva
estrategia JWT `"jwt-vecino"` con su propio secreto (`JWT_SECRET_VECINO`), su propio guard
(`JwtVecinoAuthGuard`) y sus propios endpoints bajo `/auth/vecino/*` (`registro`,
`iniciar-sesion`, `perfil`). Un token de vecino nunca debe poder usarse en un endpoint del panel ni
viceversa — verificado en vivo: un token de vecino recibe `401` al llamar `/cuentas`.

**Contraseña con regla de fuerza explícita en el DTO** (`RegistrarVecinoDto`), no solo un
`MinLength` como en `cuentas`: mínimo 8 caracteres, una mayúscula, un número y un carácter
especial — exactamente lo que pidió el usuario ("típico de 8 dígitos, 1 mayúscula, carácter
especial y número"). Vive en `comun/contrasena-segura.ts` como regex reutilizable, separada de la
política de `cuentas` (que sigue siendo solo `MinLength(8)`) porque son dos audiencias distintas:
cuentas del panel las crea un super-admin manualmente; vecinos se autorregistran desde la app.

**Token de vecino dura 30 días, no 12 horas como el de `cuentas`.** Un panel administrativo
justifica sesiones cortas; una app de consumo donde el vecino espera quedar conectado no.

**El correo de confirmación de contraseña (repetir clave) es responsabilidad del cliente, no del
backend.** El DTO de registro solo pide `contrasena` una vez — la app verifica que coincida con su
campo de confirmación antes de enviar la petición. El backend no necesita saber que existió un
segundo campo en la pantalla.

**Se agregó `app.setGlobalPrefix("v1")` en `apps/api/src/main.ts`.** `apps/movil/src/config/entorno.ts`
ya asumía `apiUrl: ".../v1"` desde que se escribió (Etapa 0), y `docs/tecnica/05-api-contrato.yaml`
declara `servers: - url: .../v1` — el servidor real nunca había aplicado ese prefijo. Se corrigió
ahora porque esta es la primera vez que `apps/movil` necesita apuntar de verdad a `apps/api`.

## Qué significa esto para Etapa 3

El login/registro de la app móvil deja de ser 100% mock — es la primera pantalla que habla con
`apps/api` de verdad, aunque el resto de la app (negocios, avisos, categorías) siga leyendo de
`datos/mock/` hasta que se aborde la Etapa 3 completa. `apps/movil/src/estado/useSesion.ts` ahora
llama a `${entorno.apiUrl}/auth/vecino/...` directamente — no pasa por `fabricaRepositorios.ts`
porque sesión/autenticación no es una entidad de contenido con repositorio mock/api intercambiable,
es un estado de sesión real de principio a fin.
