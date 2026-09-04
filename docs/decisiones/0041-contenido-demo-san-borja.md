# 0041 — Más contenido de ejemplo en San Borja

## Contexto

El usuario preguntó si podía subir información real a San Borja (negocios con fotos, avisos de
comunidad). Se le aclaró la distinción: negocios **reales** todavía no se pueden cargar sin que
el cliente entregue esos datos (sigue pendiente, ver `docs/cliente/04-avance-del-proyecto.md`) —
lo que sí se podía hacer de inmediato es sumar más **contenido de ejemplo**, igual que los 6
negocios y 4 avisos que ya existían. El usuario eligió esa opción.

## Contenido agregado

**5 negocios nuevos**, cubriendo categorías que San Borja todavía no tenía ningún ejemplo
(Hogar, Consultorías, Inmobiliaria, Rescate animal):

| Negocio | Categoría(s) | Foto |
|---|---|---|
| Cerrajería San Borja Express | Hogar, Servicios | Llave sobre fondo oscuro |
| Estudio Contable Rivas & Asociados | Consultorías | Manos con calculadora |
| Inmobiliaria Terrazas del Sur | Inmobiliaria | Edificio residencial |
| Refugio Patitas Felices | Rescate animal | Cachorro en un refugio |
| Lavandería Rápida SB | Hogar, Servicios | Lavadoras industriales |

Las 5 fotos se buscaron con `WebSearch`/`WebFetch` (el navegador de la sesión tenía bloqueado el
acceso a Unsplash) y se revisó cada una descargándola y mirándola antes de usarla — se
descartaron 3 candidatas por el mismo criterio de siempre (una llave con la marca "YALE" grabada,
una hilera de casas de suburbio muy estadounidense, una lavandería con carteles en francés
visibles) y se reemplazaron por alternativas neutras. Se insertaron directo en la base (no vía
multipart) igual que las fotos de categorías de la decisión 0029 — el campo `foto_principal_url`
acepta una URL absoluta de Unsplash tal cual, sin necesidad de subir el archivo.

Se creó todo por SQL directo en vez de recorrer la API una por una: `CrearNegocioDto` no acepta
`descripcion`, `coordenada` ni `horarios` (esos se completan después, vía `PUT .../info` y `PUT
.../horarios`, con coordenada fija al centro de la comunidad) — para tener descripciones y
horarios propios desde el vecino, y coordenadas distintas por negocio, era más directo insertar
la fila completa igual que hace `infraestructura/datos-semilla/generar-semilla.js` con el resto
del piloto. Estado `activo` directo (no pasan por la cola de validación), con
`validado_por_cuenta_id = cuenta-super-admin`, mismo criterio que los negocios de ejemplo
existentes.

**2 avisos nuevos**, para variar categorías (antes San Borja solo tenía uno publicado por
categoría "municipal" y uno "seguridad"):
- "Feria de emprendedores este sábado" — Municipalidad de San Borja, categoría "otro".
- "Jornada de limpieza en Parque Reducto N.° 2" — Junta Vecinal SB, categoría "junta_vecinal".

## Bug real encontrado y corregido de paso

Al revisar Comunidad en la app, todos los avisos (nuevos y viejos) mostraban "Hace NaN semanas".
`tiempoRelativo()` le concatenaba `"T00:00:00"` a `aviso.publicadoEn` asumiendo que era una fecha
sin hora (`"2026-08-28"`) — pero el campo ya es un timestamp completo de la base
(`"2026-08-28T09:00:00.000Z"`), así que el string resultante quedaba con dos `"T"` y `Date` lo
parseaba como inválido. Se sacó la concatenación — el string ya es un ISO válido tal cual.

## Validado en vivo

Los 5 negocios aparecen en Inicio (riel de categorías y "Negocios cerca de ti") y en la ficha
completa (foto, descripción, WhatsApp/Llamar según corresponda, galería vacía mostrando el
estado neutro de siempre). Los 2 avisos nuevos aparecen en Comunidad con su ícono y categoría
correctos. Confirmado por API: `GET /negocios?comunidadId=com-san-borja` devuelve 9 negocios
activos, `GET /avisos?comunidadId=com-san-borja` devuelve 4 publicados.
