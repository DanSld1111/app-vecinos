import { useState } from "react";
import { Publicacion } from "@app-vecinos/tipos";
import { useSesion } from "../../estado/useSesion";
import {
  alternarCorazon,
  compartirPublicacion,
  useActualizarPublicacionEnCache,
  useMisCorazones,
} from "../../datos/hooks/useParaTi";
import { useQueryClient } from "@tanstack/react-query";
import { vibrarLigero } from "../../utilidades/haptico";

/**
 * Corazón y compartir de una publicación, con el cambio optimista en todas las listas y un aviso
 * corto para mostrar con <Aviso>. En modo invitado el corazón pide iniciar sesión.
 */
export function useAccionesPublicacion() {
  const token = useSesion((e) => e.token);
  const { data: misCorazones } = useMisCorazones();
  const actualizar = useActualizarPublicacionEnCache();
  const cliente = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const [locales, setLocales] = useState<Record<string, boolean>>({});

  const tieneCorazon = (id: string) => locales[id] ?? (misCorazones ?? []).includes(id);

  async function corazon(p: Publicacion) {
    if (!token) {
      setAviso("Inicia sesión con tu cuenta de vecino para dar corazón.");
      return;
    }
    const antes = tieneCorazon(p.id);
    if (!antes) vibrarLigero();
    setLocales((l) => ({ ...l, [p.id]: !antes }));
    actualizar(p.id, (x) => ({ ...x, corazones: Math.max(0, x.corazones + (antes ? -1 : 1)) }));
    try {
      const total = await alternarCorazon(p.id, token, antes);
      actualizar(p.id, (x) => ({ ...x, corazones: total }));
      cliente.invalidateQueries({ queryKey: ["para-ti", "mis-corazones"] });
    } catch {
      setLocales((l) => ({ ...l, [p.id]: antes }));
      actualizar(p.id, (x) => ({ ...x, corazones: Math.max(0, x.corazones + (antes ? 1 : -1)) }));
      setAviso("No se pudo guardar. Intenta de nuevo.");
    }
  }

  async function compartir(p: Publicacion) {
    if (await compartirPublicacion(p)) actualizar(p.id, (x) => ({ ...x, compartidos: x.compartidos + 1 }));
  }

  return { tieneCorazon, corazon, compartir, aviso, setAviso, conCuenta: Boolean(token) };
}
