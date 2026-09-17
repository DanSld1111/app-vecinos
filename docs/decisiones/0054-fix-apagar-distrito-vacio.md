# 0054 — Fix: no se podía apagar un distrito recién activado sin comunidades

## Contexto

Al probar en vivo el flujo completo de "activar un distrito nuevo" (ver
[decisión 0053](0053-catalogo-ubigeo-aplicado.md)) con el distrito de prueba Barranco: se
activó, se le creó y luego se borró una comunidad de prueba, y el distrito quedó **activo
pero sin ninguna comunidad**. En ese estado, el botón "Apagar distrito" no aparecía en
absoluto.

## Causa

`Distritos.tsx` solo mostraba el botón de apagar cuando `!sinComunidades &&
comunidadesDelDistrito.every(c => !c.activo)` — es decir, "tiene comunidades, pero todas
están apagadas". Un distrito con **cero** comunidades (recién activado, o con todas sus
comunidades borradas) no entraba en ese caso: ni tenía el botón de apagar, ni volvía a
aparecer como "inactivo" solo. Quedaba en un estado sin salida desde la interfaz.

## Solución

Se amplió la condición a `distrito.activo && (sinComunidades ||
comunidadesDelDistrito.every(c => !c.activo))` — un distrito sin comunidades ahora se trata
igual que uno con todas sus comunidades apagadas: se puede apagar con el mismo botón y el
mismo diálogo de confirmación.

## Validado en vivo

Contra datos reales de producción (apuntando temporalmente el admin local a la API de
Render): con Barranco activo y sin comunidades, apareció "Apagar distrito Barranco" →
confirmar → pasó a "INACTIVO" correctamente, quedando igual que estaba antes de la prueba
del flujo de expansión.
