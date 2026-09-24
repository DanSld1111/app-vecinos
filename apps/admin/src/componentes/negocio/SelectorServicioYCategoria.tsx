import { useEffect, useState } from "react";
import { Categoria, ServicioApp } from "@app-vecinos/tipos";
import { SelectorServicio } from "./SelectorServicio";
import { SelectorCategoria } from "./SelectorCategoria";

/**
 * Reemplaza al SelectorCategoria suelto en el alta/edición de negocio: primero se elige el
 * Servicio (Restaurantes, Market Space…), y la Categoría queda limitada a las suyas — ya no una
 * lista plana de 13 categorías sin agrupar. Ver docs/decisiones/0072-servicio-dueno-de-categoria.md.
 */
export function SelectorServicioYCategoria({
  servicios,
  categorias,
  categoriaId,
  onCambiarCategoria,
}: {
  servicios: ServicioApp[];
  categorias: Categoria[];
  categoriaId: string;
  onCambiarCategoria: (categoriaId: string) => void;
}) {
  // Solo servicios que ya tienen al menos una categoría — Bolsa de empleo, Bolsa de puntos y
  // Taxi no son directorios de negocio, no tiene sentido ofrecerlos acá.
  const serviciosConCategorias = servicios.filter((s) => categorias.some((c) => c.servicioSlug === s.slug));

  const categoriaActual = categorias.find((c) => c.id === categoriaId) ?? null;
  const [servicioSlug, setServicioSlug] = useState(categoriaActual?.servicioSlug ?? serviciosConCategorias[0]?.slug ?? "");

  // Si cambia la categoría desde afuera (ej. se carga un negocio existente), el servicio sigue
  // a la categoría — no al revés.
  useEffect(() => {
    if (categoriaActual?.servicioSlug && categoriaActual.servicioSlug !== servicioSlug) {
      setServicioSlug(categoriaActual.servicioSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaId]);

  const categoriasDelServicio = categorias.filter((c) => c.servicioSlug === servicioSlug);

  function alCambiarServicio(nuevoSlug: string) {
    setServicioSlug(nuevoSlug);
    const primeraCategoria = categorias.find((c) => c.servicioSlug === nuevoSlug);
    onCambiarCategoria(primeraCategoria?.id ?? "");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--texto-tenue)", textTransform: "uppercase", letterSpacing: ".03em", display: "block", marginBottom: 4 }}>
          Servicio
        </label>
        <SelectorServicio servicios={serviciosConCategorias} valor={servicioSlug} onCambiar={alCambiarServicio} />
      </div>
      <div>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--texto-tenue)", textTransform: "uppercase", letterSpacing: ".03em", display: "block", marginBottom: 4 }}>
          Categoría
        </label>
        <SelectorCategoria
          categorias={categoriasDelServicio}
          valor={categoriaId}
          onCambiar={onCambiarCategoria}
          placeholder={categoriasDelServicio.length === 0 ? "Sin categorías en este servicio" : "Elegir categoría"}
        />
      </div>
    </div>
  );
}
