# 0098 — Avisos de la comunidad: inmuebles, mascotas y turismo

**Fecha:** 2026-11-10 · **Estado:** aceptada · **Reemplaza a:** 0096 (fichas Inmuebles y Tours) y 0097 (Rescate animal)

## Contexto

El cliente compartió como referencia los grupos de Facebook de alquiler y venta de San Borja, los de
mascotas perdidas y adopciones, y las páginas de turismo. Su formato funciona: muchas fotos, texto largo
y un contacto directo. La diferencia que pide es de fondo:

- **Los vecinos no publican directo:** envían su aviso a ELISUR y el equipo lo carga.
- **Sin agentes inmobiliarios, sin agencias ni albergues con cuenta.** ELISUR solo intermedia y difunde.
- El contacto del aviso es siempre **del anunciante**: el vecino o, en turismo, la agencia.
- Todo gratis por ahora.

Eso choca con lo que existía: Inmuebles, Tours y Mascotas eran *fichas de negocio* (decisiones 0096
y 0097), con inmobiliarias, agencias y albergues publicando, solicitudes de adopción y padrinazgos.

## Decisión

1. **Un solo módulo de avisos curados** (`clasificados` en el código, para no chocar con los avisos de
   Comunidad): secciones `inmuebles` (alquiler/venta), `mascotas` (perdido/encontrado/adopción) y
   `turismo` (full day, varios días, playa, aventura). Datos ordenados en `datos` (JSONB): precio,
   m², dormitorios, especie, salidas, etc.
2. **Flujo:** el vecino toca «Envíanos tu aviso» (Inicio, Comunidad, cada sección y Mis avisos), sube
   hasta 20 fotos, escribe con sus palabras, deja su WhatsApp y autoriza mostrarlo. Llega al panel
   «Avisos de vecinos» como **por revisar**. El equipo ve el texto original, completa los datos,
   ordena las fotos y publica, pide corrección por WhatsApp o rechaza con un motivo.
3. **Vigencia de 30 días.** El vecino renueva o marca «ya se alquiló / vendió / apareció / fue adoptado»
   desde «Mis avisos», donde ve vistas y contactos. Con 3 reportes de vecinos distintos un aviso
   publicado vuelve a revisión.
4. **Contacto:** si el vecino no autoriza mostrar su número, el aviso sale sin WhatsApp ni llamada.
   «Lo vi: avisar» en una mascota perdida abre WhatsApp con el mensaje ya escrito.
5. **Dónde se ve en la app:**
   - Inicio: círculos Inmuebles/Mascotas/Turismo antes de los rubros, banner «Se busca» (perdidos de la
     última semana), carrusel «Avisos de la comunidad» y el acceso para enviar uno.
   - Comunidad: filtros Inmuebles, Mascotas, Turismo junto a Municipal, Junta vecinal y Seguridad
     (Perdidos pasa a Mascotas), y botón flotante «Envíanos tu aviso».
   - Buscador: entiende «depa 2 dormitorios alquiler» como filtros y lista avisos además de negocios.
   - Perfil: «Mis avisos».
6. **Se elimina lo anterior** (se revierten los commits de 0096, 0097 y el registro adaptado): fichas
   Inmuebles/Tours/Mascotas, pantalla de Turismo, albergues, solicitudes de adopción, padrinazgos y
   pistas. Se conserva `enlaceWhatsapp` (agrega el 51).

## Datos en producción (migración 0038)

- Crea `clasificados` y `clasificados_reportes`.
- Los servicios Inmobiliaria, Turismo y Rescate animal pasan a estado `retirado` (no se listan).
- Los negocios de esos rubros se archivan (se pueden restaurar desde el panel).
- **No se borra nada.** Las tablas de Rescate animal (`mascotas`, `solicitudes_adopcion`, `padrinazgos`,
  `avisos_mascotas`, `avisos_pistas`, `avisos_reportes`), la columna `negocios.datos_albergue`,
  `productos.fotos/detalle` y los negocios archivados se eliminan en una migración aparte, con
  confirmación del cliente.

## Consecuencias

- El equipo de ELISUR asume la carga de revisar avisos: el panel la cuenta en el menú (rol super admin
  y validador de contenido).
- Sin cuentas de terceros no hay estadísticas por anunciante; el vecino ve vistas y contactos de lo suyo.
