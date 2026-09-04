# Meilisearch local (índice de búsqueda de negocios)

Binario standalone para Windows (sin Docker) — descargado de
https://github.com/meilisearch/meilisearch/releases/latest y ejecutado localmente
mientras se hace desarrollo. Ver [decisión de índice de búsqueda](../../docs/decisiones/0018-indice-de-busqueda.md).

## Arrancar

```
npm run meilisearch
```
(desde la raíz del monorepo — ver `.claude/launch.json`, configuración "meilisearch")

o directamente:
```
cd herramientas/meilisearch
./meilisearch.exe --db-path ./data --http-addr 127.0.0.1:7700 --env development
```

La master key vive en `.env` de esta carpeta (no se sube a git). `apps/api/.env` debe tener
la misma clave en `MEILI_MASTER_KEY` para que el backend pueda escribir en el índice.

## Panel visual

Con el servidor corriendo, abre http://localhost:7700 en el navegador — Meilisearch trae su
propio panel para inspeccionar el índice, probar búsquedas y ver estadísticas.

## Reindexar todo desde cero

Si el índice queda desincronizado o se borra `data/`, basta con reiniciar `apps/api`: al
arrancar, `BusquedaService` reindexa todos los negocios activos automáticamente
(`onModuleInit`).
