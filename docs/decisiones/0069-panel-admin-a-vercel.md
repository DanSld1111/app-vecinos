# 0069 — El panel de administración pasa de Netlify a Vercel

## Contexto

Después de empujar las fases 2 a 5 del módulo de negocios (`d5bade7`), el panel en
`https://elisur.netlify.app` seguía mostrando la versión vieja. La revisión fue concluyente:

- GitHub tenía el código: `origin/master` == local == `d5bade7`.
- La API en Render sí se había actualizado (`GET /v1/negocios/:id/productos/papelera` responde
  401 en vez de 404).
- El bundle servido por Netlify (`index-DuUiQX46.js`) **no contenía** ninguna cadena de las fases
  2 a 5 ("Fichas incompletas", "Solo incompletos", "Papelera", "Despublicar") y en cambio **sí**
  contenía `"Editar ficha completa → (próximamente)"`, el botón deshabilitado que se eliminó en
  la Fase 2.

O sea: Netlify no construye desde antes de `c8a6830`, por el mismo motivo que ya habíamos visto
con el móvil — *"Skipped due to account credit usage exceeded"*. El push llega a GitHub, Netlify
lo ve y decide no construirlo.

## Decisión

El panel se muda a Vercel, igual que el móvil. Es el mismo remedio ya probado en este
proyecto: el móvil se migró por esta misma razón (no quedó decisión escrita de aquella vez, solo
el `vercel.json` de la raíz).

`apps/admin/vercel.json` replica la forma que ya funcionaba en `apps/admin/netlify.toml`: instalar
y construir **desde la raíz del monorepo**, porque es un workspace de npm y `apps/admin` solo no
tiene sus dependencias.

```json
"installCommand": "cd ../.. && npm install",
"buildCommand":   "cd ../.. && npm run build --workspace=apps/admin",
"outputDirectory": "dist"
```

El proyecto en Vercel usa **Root Directory = `apps/admin`**, así que `outputDirectory` es `dist`
relativo a esa carpeta y Vercel toma este `vercel.json` (el de la raíz es del móvil).

### Por qué el `headers` excluye `assets/`

Los archivos de `assets/` llevan hash en el nombre, así que se pueden cachear para siempre; todo
lo demás — sobre todo `index.html`, que es quien apunta al bundle nuevo — va con
`no-cache, must-revalidate`. Sin eso volveríamos al problema de la
[0064](0064-cache-control-pwa-instalada.md): código nuevo publicado que el navegador no ve.

## Dos cosas que hay que configurar a mano en el tablero

1. **`VITE_API_URL` = `https://app-vecinos.onrender.com/v1`** en las variables de entorno del
   proyecto. Verificado que la variable del tablero le gana al `apps/admin/.env` local (que
   apunta a `localhost:3000` y no está versionado): construyendo con la variable puesta, el
   bundle contiene la URL de Render y **cero** ocurrencias de `localhost:3000`.
2. **El origen nuevo en `CORS_ORIGENES_PERMITIDOS` de Render.** Sin esto el login falla, que es
   exactamente lo que pasó cuando se migró el móvil.

`apps/admin/netlify.toml` se deja en su sitio a propósito hasta confirmar que el despliegue en
Vercel funciona — es el plan B si la cuenta de Netlify se destraba antes.
