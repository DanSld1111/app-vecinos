import { ReactNode, useEffect, useState } from "react";
import { Negocio, Producto } from "@app-vecinos/tipos";
import { useCategorias } from "../../estado/useCategorias";
import { useBorradorNegocio } from "../../estado/useBorradorNegocio";
import { listarProductos } from "../../datos/productosApi";
import { VistaPreviaNegocio } from "../fichas/VistaPreviaNegocio";

/**
 * Cualquier pestaña de edición de un negocio (admin o dueño) con el celular de vista previa al
 * costado. El celular combina lo guardado con lo que la pestaña abierta está editando
 * (useBorradorNegocio), así se ve cómo quedará antes de guardar.
 */
export function ConVistaPrevia({ negocio, children }: { negocio: Negocio; children: ReactNode }) {
  const categorias = useCategorias((e) => e.categorias);
  const cargarCategorias = useCategorias((e) => e.cargar);
  const cambios = useBorradorNegocio((e) => e.cambios);
  const productosBorrador = useBorradorNegocio((e) => e.productos);
  const publicarProductos = useBorradorNegocio((e) => e.publicarProductos);
  const enfoque = useBorradorNegocio((e) => e.enfoque);
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    if (categorias.length === 0) cargarCategorias();
  }, [categorias.length, cargarCategorias]);

  useEffect(() => {
    let vigente = true;
    publicarProductos(null);
    listarProductos(negocio.id)
      .then((p) => vigente && setProductos(p))
      .catch(() => vigente && setProductos([]));
    return () => {
      vigente = false;
    };
  }, [negocio.id, publicarProductos]);

  const vista: Negocio = { ...negocio, ...cambios };
  // Vacío, null y lista vacía cuentan como lo mismo (ej. un negocio sin ofertas guardadas).
  const normal = (v: unknown) => JSON.stringify(v === undefined || v === "" || (Array.isArray(v) && v.length === 0) ? null : v);
  const sinGuardar = (Object.keys(cambios) as (keyof Negocio)[]).some((k) => normal(cambios[k]) !== normal(negocio[k]));

  return (
    <div className="con-telefono">
      <div className="con-telefono-principal">{children}</div>
      <VistaPreviaNegocio negocio={vista} categorias={categorias} productos={productosBorrador ?? productos} sinGuardar={sinGuardar} enfoque={enfoque} />
    </div>
  );
}
