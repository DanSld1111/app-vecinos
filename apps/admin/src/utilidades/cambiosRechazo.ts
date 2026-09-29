import { Categoria, Negocio } from "@app-vecinos/tipos";
import { resumenHorario } from "./horarios";

export interface CambioRechazo {
  campo: string;
  antes: string;
  ahora: string;
}

/**
 * Qué cambió en un negocio desde que lo rechazaron (negocio.versionRechazada), para el reenvío
 * y para la cola del validador. null si no hay versión rechazada guardada (rechazos anteriores
 * a la decisión 0086).
 */
export function cambiosDesdeRechazo(negocio: Negocio, categorias: Categoria[]): CambioRechazo[] | null {
  const v = negocio.versionRechazada;
  if (!v) return null;
  const nombresCat = (ids: string[]) => ids.map((id) => categorias.find((c) => c.id === id)?.nombre ?? id).join(", ") || "Sin categoría";
  const texto = (x: string | null | undefined) => (x && x.trim() ? x.trim() : "—");
  const filas: CambioRechazo[] = [
    { campo: "Nombre", antes: texto(v.nombre), ahora: texto(negocio.nombre) },
    { campo: "Descripción", antes: texto(v.descripcion), ahora: texto(negocio.descripcion) },
    { campo: "Categoría", antes: nombresCat(v.categoriaIds), ahora: nombresCat(negocio.categoriaIds) },
    { campo: "Dirección", antes: texto(v.direccion), ahora: texto(negocio.direccion) },
    { campo: "Teléfono", antes: texto(v.telefono), ahora: texto(negocio.telefono) },
    { campo: "WhatsApp", antes: texto(v.whatsapp), ahora: texto(negocio.whatsapp) },
    { campo: "Horario", antes: resumenHorario(v.horarios), ahora: resumenHorario(negocio.horarios) },
    {
      campo: "Foto de portada",
      antes: v.fotoPrincipalUrl ? "Con foto" : "Sin foto",
      // Misma URL = misma foto; otra URL = la cambiaron.
      ahora: negocio.fotoPrincipalUrl ? (negocio.fotoPrincipalUrl === v.fotoPrincipalUrl ? "Con foto" : "Foto nueva") : "Sin foto",
    },
  ];
  return filas.filter((f) => f.antes !== f.ahora);
}
