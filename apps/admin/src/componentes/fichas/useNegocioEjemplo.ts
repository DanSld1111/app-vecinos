import { useEffect, useState } from "react";
import { Negocio, Producto, ResultadoPaginado, TipoFicha } from "@app-vecinos/tipos";
import { apiFetch } from "../../datos/clienteApi";

// Se piden una sola vez por sesión del panel: la vista previa cambia de categoría a cada clic y no
// hace falta volver a traer la lista de negocios cada vez.
let negociosEnCache: Promise<Negocio[]> | null = null;
const productosEnCache = new Map<string, Promise<Producto[]>>();

function negociosActivos(token: string): Promise<Negocio[]> {
  if (!negociosEnCache) {
    negociosEnCache = apiFetch<ResultadoPaginado<Negocio>>("/negocios/admin?limite=200", { token })
      .then((r) => r.items.filter((n) => n.estado === "activo"))
      .catch(() => {
        negociosEnCache = null;
        return [];
      });
  }
  return negociosEnCache;
}

function productosDe(negocioId: string): Promise<Producto[]> {
  let p = productosEnCache.get(negocioId);
  if (!p) {
    p = apiFetch<Producto[]>(`/negocios/${negocioId}/productos`).catch(() => []);
    productosEnCache.set(negocioId, p);
  }
  return p;
}

/** Si el negocio ya cargó lo que muestra esa ficha (sin contar productos, que se piden aparte). */
function tieneContenido(n: Negocio, ficha: TipoFicha): boolean {
  if (ficha === "servicios") return Boolean(n.serviciosOfrecidos?.length);
  if (ficha === "rubros") return Boolean(n.rubrosDisponibles?.length);
  if (ficha === "ofertas") return Boolean(n.ofertas?.length || n.pasillos?.length);
  if (ficha === "galeria") return n.fotosGaleria.length > 0;
  return false;
}

/**
 * Un negocio publicado de alguna de estas categorías (en orden de preferencia), con sus
 * productos, para que la vista previa de una ficha muestre contenido real. Se prefiere uno que ya
 * tenga el contenido de esa ficha, y después uno con foto de portada. null si ninguna
 * categoría tiene negocios todavía: la vista previa usa entonces contenido de ejemplo.
 */
export function useNegocioEjemplo(categoriaIds: string[], ficha: TipoFicha, token: string | null) {
  const [estado, setEstado] = useState<{ negocio: Negocio | null; productos: Producto[]; cargando: boolean }>({
    negocio: null,
    productos: [],
    cargando: true,
  });
  const clave = categoriaIds.join(",");

  useEffect(() => {
    let vigente = true;
    if (!token) {
      setEstado({ negocio: null, productos: [], cargando: false });
      return;
    }
    setEstado((e) => ({ ...e, cargando: true }));
    (async () => {
      const negocios = await negociosActivos(token);
      const ids = clave ? clave.split(",") : [];
      const candidatos = ids
        .flatMap((id) => negocios.filter((n) => n.categoriaIds.includes(id)))
        .sort((a, b) => Number(Boolean(b.fotoPrincipalUrl)) - Number(Boolean(a.fotoPrincipalUrl)));
      let negocio: Negocio | null = null;
      let productos: Producto[] = [];
      if (ficha === "menu" || ficha === "catalogo") {
        for (const n of candidatos.slice(0, 5)) {
          const p = await productosDe(n.id);
          if (p.length) {
            negocio = n;
            productos = p;
            break;
          }
        }
      } else {
        negocio = candidatos.find((n) => tieneContenido(n, ficha)) ?? null;
      }
      negocio ??= candidatos[0] ?? null;
      if (negocio && !productos.length) productos = await productosDe(negocio.id);
      if (vigente) setEstado({ negocio, productos, cargando: false });
    })();
    return () => {
      vigente = false;
    };
  }, [clave, ficha, token]);

  return estado;
}
