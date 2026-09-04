# Guía de desarrollo

## Preparar una PC nueva (clon del repo)

El repo vive en `https://github.com/DanSld1111/app-vecinos` (privado). Nada de lo que sigue
se sube a git — cada PC lo arma por su cuenta.

```bash
git clone https://github.com/DanSld1111/app-vecinos.git
cd app-vecinos
npm install
```

### 1. Archivos `.env`

Cada app tiene un `.env.example` con los valores que necesita — copiar y completar:

| App | Archivo a crear | A partir de |
|---|---|---|
| `apps/api` | `.env` | `apps/api/.env.example` |
| `apps/admin` | `.env` | `apps/admin/.env.example` |
| `apps/movil` | `.env.local` (opcional) | `apps/movil/.env.example` |
| `herramientas/meilisearch` | `.env` | ver punto 3 |

`apps/movil` no necesita `.env.local` para arrancar: por defecto usa datos mock
(`EXPO_PUBLIC_DATA_SOURCE=mock`), sin backend. Solo se crea si vas a conectarla a la API real.

Los secretos (`JWT_SECRET`, `JWT_SECRET_VECINO`) deben generarse nuevos en cada entorno real
con `openssl rand -hex 32` — no reusar el valor de ejemplo. En una PC de desarrollo personal
no es crítico, pero es buena costumbre no repetir el mismo secreto en todas las PCs.

### 2. Base de datos (PostgreSQL)

`apps/api/.env` → `DATABASE_URL` apunta a un Postgres local. Si la PC nueva no tiene uno
corriendo, instalar PostgreSQL (con extensión PostGIS) y crear la base `app_vecinos` antes
de levantar la API. Ver [docs/tecnica/04-modelo-de-datos.md](04-modelo-de-datos.md) para el
esquema.

### 3. Meilisearch (índice de búsqueda, opcional)

No es obligatorio para desarrollar — si no está corriendo, la búsqueda cae a consulta directa
en Postgres (ver comentario en `apps/api/.env.example`). Para levantarlo:

1. Descargar el binario de Windows desde
   https://github.com/meilisearch/meilisearch/releases/latest y guardarlo como
   `herramientas/meilisearch/meilisearch.exe` (no se sube a git por su peso, ~128MB).
2. Crear `herramientas/meilisearch/.env` con una master key propia:
   ```
   MEILI_MASTER_KEY=<generar con: openssl rand -hex 32>
   MEILI_NO_ANALYTICS=true
   ```
3. Copiar esa misma clave en `MEILI_MASTER_KEY` de `apps/api/.env`.
4. Arrancar con `npm run meilisearch` desde la raíz.

Detalle completo en [herramientas/meilisearch/README.md](../../herramientas/meilisearch/README.md).

## Correr la app

```bash
cd apps/movil
npm run web    # navegador, para pruebas rápidas
npm run start  # Expo Dev Tools (QR para Android/iOS con Expo Go)
```

## Problema conocido: `npx tsc --noEmit` marca errores en `apps/movil`

Con las versiones instaladas por el scaffold de Expo (React 19.2.3, React Native 0.86.2, `@types/react` ~19.2.2, TypeScript ~6.0.3), `tsc --noEmit` reporta errores como:

```
error TS2786: 'View' cannot be used as a JSX component.
```

en todos los archivos que usan componentes de React Native (`View`, `Text`, `TextInput`, etc.). Es una incompatibilidad de tipos entre versiones recién publicadas de `react-native` y `@types/react` — **no afecta el funcionamiento real de la app**: Metro/Babel no usan estos tipos para compilar, y la aplicación corre y se probó de punta a punta en el navegador sin errores de consola.

No perseguir esto ajustando versiones a mano: se probó fijar `react`, `react-dom` y `@types/react` a distintas combinaciones y no se encontró una combinación estable sin introducir además duplicados de React (que si rompen el runtime). La vía correcta es esperar a que el ecosistema (React Native o `@types/react`) publique una versión de parche que resuelva la incompatibilidad, y entonces correr `npx expo install --check` dentro de `apps/movil`.

## Convenciones

- Todo archivo de pantalla vive bajo `app/` (Expo Router, basado en archivos).
- Ningún componente importa `datos/mock` ni `datos/api` directamente — siempre pasa por `datos/fabricaRepositorios.ts` o por los hooks de `datos/hooks/`.
- Todo color, tamaño de fuente o espaciado sale de `src/disenio/`, nunca un literal.
- Todo texto visible sale de `src/i18n/es.ts`.
