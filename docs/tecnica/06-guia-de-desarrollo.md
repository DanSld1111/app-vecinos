# Guía de desarrollo

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
