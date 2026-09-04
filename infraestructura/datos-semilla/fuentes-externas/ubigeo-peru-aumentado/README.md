# Fuente: ubigeo-peru-aumentado

CSV descargados tal cual (sin editar) el 2 de septiembre de 2026 desde:
https://github.com/jmcastagnetto/ubigeo-peru-aumentado

- **Licencia**: MIT.
- **Origen de los datos**: compilación de INEI y RENIEC (los dos sistemas de codificación
  UBIGEO del Perú, no siempre equivalentes), CEPLAN, MINSA y PNUD-Perú — ver el propio
  repositorio para el detalle de cada columna.
- **Por qué esta fuente y no el UBIGEO "crudo" del INEI**: el catálogo oficial del INEI no
  publica coordenadas por distrito en un formato reutilizable; este repositorio ya cruza esa
  información (latitud/longitud, altitud, superficie) por distrito, que es justamente lo que
  exige el esquema de este proyecto (`distritos.centro` es `geography(Point)`, no puede quedar
  vacío).
- **1893 distritos utilizables** (de 1895 filas — una fila no tiene código UBIGEO válido y se
  descartó). El documento maestro del proyecto mencionaba "1874 distritos" citando una versión
  más antigua del catálogo del INEI; esta fuente incluye distritos creados o reorganizados
  después de esa cifra, documentado en el propio changelog del repositorio (actualización del
  16 de agosto de 2021).
- **19 distritos sin coordenada propia en la fuente** (localidades pequeñas y remotas, sobre
  todo en la selva) — se les asignó el centro de su provincia como aproximación. Ver
  `generar-catalogo-ubigeo.js` para el detalle exacto de cuáles.
- **Limitación conocida: a varios nombres de provincia y distrito les faltan tildes** (ej. "San
  Jeronimo" en vez de "San Jerónimo", heredado tal cual de la fuente). Se corrigieron a mano los
  25 nombres de departamento (una lista corta, bien conocida, sin margen de error) pero no los
  ~2000 nombres de provincia/distrito — corregir cada uno sin una fuente verificada sería tan
  poco confiable como no corregir ninguno. No afecta al piloto (San Borja/Miraflores/Surco/
  Surquillo ya estaban bien escritos desde antes en `0001_piloto.sql`) ni a nada visible hoy —
  son registros `activo=false`. Al activar una comunidad nueva, revisar/corregir el nombre real
  del distrito debe quedar como paso explícito de ese checklist.

Ver `../generar-catalogo-ubigeo.js` para el script que genera
`../0002_catalogo-ubigeo-nacional.sql` a partir de estos tres archivos.
