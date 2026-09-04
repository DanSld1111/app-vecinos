# Política de Privacidad — ELISUR

> ⚠️ **BORRADOR — PENDIENTE DE REVISIÓN LEGAL. No publicar tal cual.**
> Este documento es un punto de partida redactado a partir de lo que la aplicación
> **realmente hace hoy** (no una plantilla genérica copiada de internet) para que un abogado
> especializado en protección de datos lo revise, corrija y complete antes de publicarlo. Los
> campos entre corchetes `[ASÍ]` son datos que la empresa debe completar (razón social, RUC,
> domicilio, etc. — hoy no existen porque el proyecto no está formalmente constituido). "ELISUR"
> es el nombre provisional del producto (ver pendiente de nombre de marca definitivo).
>
> Basado en el estado real del código al 2 de septiembre de 2026. Si la app cambia (por ejemplo,
> si se agrega geolocalización por GPS, notificaciones push con token de dispositivo, o el
> módulo de pagos), este documento debe actualizarse — no es una plantilla que sirva para
> siempre sola.

## 1. Quiénes somos

`[RAZÓN SOCIAL PENDIENTE]`, identificada con RUC `[PENDIENTE]`, con domicilio en
`[DIRECCIÓN PENDIENTE]`, Perú (en adelante, "nosotros" o "ELISUR"), es responsable del
tratamiento de los datos personales que recibe a través de la aplicación móvil y el sitio web
ELISUR (en adelante, la "Plataforma").

Para cualquier consulta sobre esta política o sobre tus datos personales, puedes escribirnos a
`[correo de contacto pendiente — hoy configurado como contacto@elisur.app, un dominio de
ejemplo, no registrado todavía]`.

## 2. Qué datos recolectamos

Solo recolectamos lo que la Plataforma efectivamente usa para funcionar — nada de lo listado
abajo se adivina ni se completa "por si acaso":

### 2.1. Si te registras como vecino (usuario de la app)
- Nombre y apellido
- Correo electrónico
- Número de celular
- Contraseña (nunca se guarda en texto plano — se guarda protegida con un algoritmo de hash
  de un solo sentido, `bcrypt`; ni siquiera el equipo técnico puede leerla)
- El distrito/comunidad que elijas manualmente de una lista (ej. "San Borja") — **la Plataforma
  no accede a tu ubicación GPS ni la solicita**; tú eliges tu zona a mano.

### 2.2. Si administras una cuenta del panel (dueño de negocio, junta vecinal, validador, equipo
ELISUR)
- Nombre, correo electrónico, rol asignado, y (según el rol) qué negocios administras o a qué
  distritos tienes acceso
- Contraseña, igual de protegida que la del punto anterior

### 2.3. Si publicas contenido (un negocio, un aviso)
- La información del negocio o del aviso que tú decidas publicar (nombre del negocio,
  dirección, teléfono de contacto, horario, fotos si las subes, texto del aviso) — esto es
  contenido que tú eliges hacer público en la Plataforma, no datos personales tuyos ocultos.

### 2.4. Recuperación de contraseña
Si pides recuperar tu contraseña, generamos un código temporal de 6 dígitos válido por 15
minutos, asociado a tu cuenta de forma protegida (hash, igual que la contraseña). `[Nota para
revisión legal: hoy este código se registra en un log técnico interno del servidor mientras no
se contrata un proveedor de envío de correos — nunca llega al correo del usuario todavía. Esto
debe quedar resuelto antes de un lanzamiento real; ver docs/tecnica/11-plan-seguridad.md.]`

### 2.5. Lo que NO recolectamos (hoy)
Para que quede explícito y no se asuma de más: la Plataforma, en su versión actual, no pide
documento de identidad, no accede a tu ubicación GPS, no registra un identificador de tu
dispositivo para notificaciones push, no procesa pagos ni datos de tarjetas, y no comparte datos
con redes sociales (el botón "Continuar con Google" existe en la pantalla pero está marcado
"Próximamente", todavía no funciona).

## 3. Para qué usamos tus datos

- Crear y mantener tu cuenta, y permitirte iniciar sesión.
- Mostrarte el contenido (negocios, avisos, profesionales) de la comunidad que elegiste.
- Si publicaste un negocio o un aviso, permitir que el equipo de validación lo revise antes de
  que se publique para el resto de vecinos.
- Comunicarnos contigo si hay un problema con tu cuenta o tu contenido publicado (por ejemplo,
  si un negocio fue rechazado, para indicarte el motivo).
- Enviarte el código de recuperación de contraseña cuando lo solicites.

`[Para revisión legal: definir explícitamente la base legal de cada tratamiento según la Ley
N.° 29733 y su reglamento — ej. "ejecución de un contrato/relación con el usuario" para el punto
de cuenta, "consentimiento" para cualquier uso futuro con fines distintos.]`

## 4. Con quién compartimos tus datos

Hoy, con nadie fuera de la operación normal de la Plataforma. No vendemos datos personales a
terceros. `[Para revisión legal: listar acá el proveedor de hosting/base de datos una vez
elegido, y cualquier proveedor de correo electrónico o analítica que se contrate a futuro —
Sentry y PostHog están en el plan técnico pero no implementados todavía, ver
docs/tecnica/10-fases-pendientes.pdf.]`

## 5. Cuánto tiempo guardamos tus datos

`[Para revisión legal: definir un plazo o criterio de conservación — ej. mientras la cuenta esté
activa, más un período tras la baja para cumplir obligaciones legales. Hoy el sistema no borra
datos automáticamente por tiempo; eliminar una cuenta es una acción manual del equipo.]`

## 6. Tus derechos

Como titular de tus datos personales, la Ley N.° 29733 (Ley de Protección de Datos Personales
del Perú) y su reglamento te reconocen los derechos de **acceso, rectificación, cancelación y
oposición** (derechos ARCO) sobre tus datos. Puedes ejercerlos escribiendo a
`[correo de contacto pendiente]`.

`[Para revisión legal: agregar el procedimiento exacto — plazo de respuesta, formato de la
solicitud, y si corresponde inscribir el banco de datos personales ante la Autoridad Nacional de
Protección de Datos Personales (ANPD).]`

## 7. Seguridad de tus datos

Aplicamos medidas técnicas para proteger tu información — contraseñas nunca en texto plano,
comunicación cifrada (una vez desplegado con HTTPS), y control de acceso por rol dentro de
nuestros propios sistemas. El detalle técnico completo (y sus pendientes) está documentado en
`docs/tecnica/11-plan-seguridad.md`, disponible para quien lo solicite.

## 8. Menores de edad

`[Para revisión legal: definir la política de edad mínima. La Plataforma hoy no verifica edad
en el registro — hay que decidir si se restringe a mayores de edad o se define un tratamiento
específico para menores, según lo que exige la normativa peruana.]`

## 9. Cambios a esta política

Si actualizamos esta política, publicaremos la nueva versión en este mismo lugar con la fecha
de la actualización. `[Para revisión legal: definir si hace falta notificar activamente a los
usuarios ante cambios sustanciales.]`

---
*Última actualización: [PENDIENTE — se completa al publicar la versión revisada legalmente]*
