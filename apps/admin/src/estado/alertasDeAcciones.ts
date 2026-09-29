import { StoreApi, UseBoundStore } from "zustand";
import { Horarios } from "@app-vecinos/tipos";
import { alertaExito, useToasts } from "./useToasts";
import { useNegocios } from "./useNegocios";
import { useCategorias } from "./useCategorias";
import { useServiciosApp } from "./useServiciosApp";
import { useCuentas } from "./useCuentas";
import { useAvisos } from "./useAvisos";
import { useAnuncios } from "./useAnuncios";
import { useNovedades } from "./useNovedades";
import { useGeografia } from "./useGeografia";
import { useUsuarios } from "./useUsuarios";
import { resumenHorario } from "../utilidades/horarios";

/**
 * Todas las acciones que cambian algo en el panel avisan con una alerta (decisión 0084): qué se
 * hizo y dónde, o por qué no se pudo. Se conectan aquí, una sola vez, en vez de en cada pantalla:
 * así ninguna acción queda sin aviso aunque la use una pantalla nueva.
 *
 * Cada store ya deja el motivo de un fallo en su campo `error`; el envoltorio lo limpia antes de
 * la acción y, si aparece después, muestra la alerta de error (con "Reintentar").
 */
type Estado = { error: string | null };
type Mensajes<S> = {
  /** Título y detalle de la alerta de éxito, a partir de los argumentos y del estado antes y después. */
  exito?: (args: any[], antes: S, despues: S, resultado: unknown) => [string, string?] | null;
  /** Título de la alerta si falla: "No se pudo guardar el horario". */
  error: string;
};

function conAlertas<S extends Estado>(store: UseBoundStore<StoreApi<S>>, acciones: Partial<Record<keyof S, Mensajes<S>>>) {
  for (const [nombre, mensajes] of Object.entries(acciones) as [keyof S, Mensajes<S>][]) {
    const original = store.getState()[nombre] as unknown as (...args: any[]) => Promise<unknown>;
    const envuelta = async (...args: any[]) => {
      const antes = store.getState();
      store.setState({ error: null } as Partial<S>);
      const resultado = await original(...args);
      const despues = store.getState();
      if (despues.error) {
        // Si el motivo es solo "No se pudo…" (sin respuesta del servidor), se explica qué revisar.
        const motivo = /^No se pud/.test(despues.error) ? "Revisa tu conexión a internet e intenta de nuevo." : despues.error;
        useToasts.getState().alertar({ tipo: "error", titulo: mensajes.error, detalle: motivo, reintentar: () => void envuelta(...args) });
      } else if (mensajes.exito) {
        const texto = mensajes.exito(args, antes, despues, resultado);
        if (texto) alertaExito(texto[0], texto[1]);
      }
      return resultado;
    };
    store.setState({ [nombre]: envuelta } as Partial<S>);
  }
}

const cantidad = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

// ---- Negocios ----
type EN = ReturnType<typeof useNegocios.getState>;
const negocio = (s: EN, id: string) => s.negocios.find((n) => n.id === id)?.nombre ?? "El negocio";
conAlertas(useNegocios, {
  crear: { error: "No se pudo registrar el negocio", exito: ([d]) => ["Negocio registrado", `${d.nombre} · se completa en los pasos siguientes`] },
  aprobar: { error: "No se pudo publicar el negocio", exito: ([id], a) => ["Negocio publicado", `${negocio(a, id)} ya aparece en la app`] },
  despublicar: { error: "No se pudo despublicar el negocio", exito: ([id], a) => ["Negocio despublicado", `${negocio(a, id)} ya no aparece en la app`] },
  rechazar: { error: "No se pudo rechazar el negocio", exito: ([id, motivo], a) => ["Negocio rechazado", `${negocio(a, id)} · ${motivo}`] },
  archivar: { error: "No se pudo archivar el negocio", exito: ([id], a) => ["Negocio archivado", `${negocio(a, id)} · puedes restaurarlo desde "Ver archivados"`] },
  restaurarArchivo: { error: "No se pudo restaurar el negocio", exito: ([id], a) => ["Negocio restaurado", negocio(a, id)] },
  eliminar: { error: "No se pudo eliminar el negocio", exito: ([id], a) => ["Negocio eliminado", negocio(a, id)] },
  actualizarInfo: { error: "No se pudo guardar la información", exito: ([id], _a, d) => ["Información guardada", negocio(d, id)] },
  actualizarHorarios: {
    error: "No se pudo guardar el horario",
    exito: ([id, horarios], _a, d) => ["Horario guardado", `${negocio(d, id)} · ${resumenHorario(horarios as Horarios)}`],
  },
  agregarOferta: { error: "No se pudo agregar la oferta", exito: ([id, o], _a, d) => ["Oferta agregada", `"${o.nombre}" · ${negocio(d, id)}`] },
  eliminarOferta: {
    error: "No se pudo quitar la oferta",
    exito: ([id, i], a) => ["Oferta quitada", `"${a.negocios.find((n) => n.id === id)?.ofertas?.[i]?.nombre ?? "Oferta"}" · ${negocio(a, id)}`],
  },
  subirFoto: { error: "No se pudo subir la foto", exito: ([id], _a, d) => ["Foto de portada actualizada", `${negocio(d, id)} · ya se ve en la app`] },
  subirFotoProducto: { error: "No se pudo subir la foto del producto", exito: () => ["Foto del producto actualizada"] },
  agregarFotoGaleria: { error: "No se pudo subir la foto a la galería", exito: ([id], _a, d) => ["Foto agregada a la galería", negocio(d, id)] },
  eliminarFotoGaleria: { error: "No se pudo quitar la foto", exito: ([id], _a, d) => ["Foto quitada de la galería", negocio(d, id)] },
  guardarServicios: {
    error: "No se pudieron guardar los servicios",
    exito: ([id, servicios], _a, d) => ["Servicios guardados", `${cantidad(servicios.length, "servicio", "servicios")} · ${negocio(d, id)}`],
  },
  subirFotoServicio: { error: "No se pudo subir la foto del servicio" },
  guardarLista: {
    error: "No se pudo guardar la lista",
    exito: ([id, lista, items], _a, d) => [
      lista === "rubros" ? "Rubros guardados" : "Pasillos guardados",
      `${cantidad(items.length, lista === "rubros" ? "rubro" : "pasillo", lista === "rubros" ? "rubros" : "pasillos")} · ${negocio(d, id)}`,
    ],
  },
});

// ---- Categorías y servicios de la app ----
type EC = ReturnType<typeof useCategorias.getState>;
const categoria = (s: EC, id: string) => s.categorias.find((c) => c.id === id)?.nombre ?? "La categoría";
conAlertas(useCategorias, {
  crear: { error: "No se pudo crear la categoría", exito: ([c]) => ["Categoría creada", c.nombre] },
  actualizar: { error: "No se pudo guardar la categoría", exito: ([id], _a, d) => ["Categoría guardada", categoria(d, id)] },
  subirFoto: { error: "No se pudo subir la foto", exito: ([id], _a, d) => ["Foto de la categoría actualizada", categoria(d, id)] },
});
type ES = ReturnType<typeof useServiciosApp.getState>;
const servicio = (s: ES, slug: string) => s.servicios.find((x) => x.slug === slug)?.nombre ?? "El servicio";
conAlertas(useServiciosApp, {
  actualizar: { error: "No se pudo guardar el servicio", exito: ([slug], _a, d) => ["Servicio guardado", servicio(d, slug)] },
  subirFoto: { error: "No se pudo subir la foto", exito: ([slug], _a, d) => ["Foto del servicio actualizada", servicio(d, slug)] },
});

// ---- Cuentas y vecinos ----
type ECu = ReturnType<typeof useCuentas.getState>;
const cuenta = (s: ECu, id: string) => s.cuentas.find((c) => c.id === id)?.nombre ?? "La cuenta";
conAlertas(useCuentas, {
  crear: { error: "No se pudo crear la cuenta", exito: ([d]) => ["Cuenta creada", `${d.nombre} · ${d.correo}`] },
  actualizar: { error: "No se pudo guardar la cuenta", exito: ([id], _a, d) => ["Cuenta guardada", cuenta(d, id)] },
  eliminar: { error: "No se pudo eliminar la cuenta", exito: ([id], a) => ["Cuenta eliminada", cuenta(a, id)] },
  restablecerClave: { error: "No se pudo cambiar la contraseña", exito: ([id], _a, d) => ["Contraseña cambiada", cuenta(d, id)] },
  alternarActivo: {
    error: "No se pudo cambiar el estado de la cuenta",
    exito: ([id], _a, d) => [d.cuentas.find((c) => c.id === id)?.activo ? "Cuenta activada" : "Cuenta desactivada", cuenta(d, id)],
  },
  agregarNegocio: {
    error: "No se pudo vincular el negocio",
    exito: ([cuentaId, negocioId], _a, d) => ["Dueño vinculado", `${cuenta(d, cuentaId)} ahora administra ${negocio(useNegocios.getState(), negocioId)}`],
  },
  quitarNegocio: {
    error: "No se pudo desvincular el negocio",
    exito: ([cuentaId, negocioId], _a, d) => ["Negocio desvinculado", `${cuenta(d, cuentaId)} ya no administra ${negocio(useNegocios.getState(), negocioId)}`],
  },
});
type EU = ReturnType<typeof useUsuarios.getState>;
const vecino = (s: EU, id: string) => {
  const u = s.usuarios.find((x) => x.id === id);
  return u ? `${u.nombre} ${u.apellido}` : "El vecino";
};
conAlertas(useUsuarios, {
  alternarBloqueo: {
    error: "No se pudo cambiar el estado del vecino",
    exito: ([id], _a, d) => [d.usuarios.find((u) => u.id === id)?.estado === "bloqueado" ? "Vecino bloqueado" : "Vecino desbloqueado", vecino(d, id)],
  },
  eliminar: { error: "No se pudo eliminar al vecino", exito: ([id], a) => ["Vecino eliminado", vecino(a, id)] },
});

// ---- Contenido: avisos, publicidad y novedades ----
type EA = ReturnType<typeof useAvisos.getState>;
const aviso = (s: EA, id: string) => s.avisos.find((a) => a.id === id)?.titulo ?? "El aviso";
conAlertas(useAvisos, {
  aprobar: { error: "No se pudo publicar el aviso", exito: ([id], a) => ["Aviso publicado", aviso(a, id)] },
  rechazar: { error: "No se pudo rechazar el aviso", exito: ([id, motivo], a) => ["Aviso rechazado", `${aviso(a, id)} · ${motivo}`] },
  crear: { error: "No se pudo publicar el aviso", exito: ([d]) => ["Aviso publicado", d.titulo] },
  eliminar: { error: "No se pudo eliminar el aviso", exito: ([id], a) => ["Aviso eliminado", aviso(a, id)] },
  enviarAValidacion: { error: "No se pudo enviar el aviso", exito: ([d]) => ["Aviso enviado a revisión", `${d.titulo} · te avisaremos cuando se publique`] },
  reenviarTrasRechazo: { error: "No se pudo reenviar el aviso", exito: ([, d]) => ["Aviso reenviado a revisión", d.titulo] },
});
type EAn = ReturnType<typeof useAnuncios.getState>;
const anuncio = (s: EAn, id: string) => s.anuncios.find((a) => a.id === id)?.nombre ?? "El anuncio";
conAlertas(useAnuncios, {
  crear: { error: "No se pudo crear el anuncio", exito: ([d]) => ["Anuncio creado", d.nombre] },
  actualizar: { error: "No se pudo guardar el anuncio", exito: ([id], _a, d) => ["Anuncio guardado", anuncio(d, id)] },
  eliminar: { error: "No se pudo eliminar el anuncio", exito: ([id], a) => ["Anuncio eliminado", anuncio(a, id)] },
  alternarActivo: {
    error: "No se pudo cambiar el anuncio",
    exito: ([id], _a, d) => [d.anuncios.find((x) => x.id === id)?.activo ? "Anuncio activado" : "Anuncio pausado", anuncio(d, id)],
  },
  subirFoto: { error: "No se pudo subir la imagen", exito: ([id], _a, d) => ["Imagen del anuncio actualizada", anuncio(d, id)] },
});
type ENo = ReturnType<typeof useNovedades.getState>;
const novedad = (s: ENo, id: string) => s.novedades.find((n) => n.id === id)?.titulo ?? "La novedad";
conAlertas(useNovedades, {
  crear: { error: "No se pudo crear la novedad", exito: ([titulo]) => ["Novedad creada", titulo] },
  actualizar: { error: "No se pudo guardar la novedad", exito: ([, titulo]) => ["Novedad guardada", titulo] },
  eliminar: { error: "No se pudo eliminar la novedad", exito: ([id], a) => ["Novedad eliminada", novedad(a, id)] },
  alternarActivo: {
    error: "No se pudo cambiar la novedad",
    exito: ([id], _a, d) => [d.novedades.find((n) => n.id === id)?.activo ? "Novedad activada" : "Novedad pausada", novedad(d, id)],
  },
});

// ---- Territorio ----
type EG = ReturnType<typeof useGeografia.getState>;
const distrito = (s: EG, ubigeo: string) =>
  [...s.distritos, ...s.resultadosBusqueda].find((d) => d.ubigeo === ubigeo)?.nombre ?? "El distrito";
const comunidad = (s: EG, id: string) => s.comunidades.find((c) => c.id === id)?.nombre ?? "La comunidad";
conAlertas(useGeografia, {
  activarDistrito: { error: "No se pudo activar el distrito", exito: ([u], a, d) => ["Distrito activado", distrito(d, u) || distrito(a, u)] },
  desactivarDistrito: { error: "No se pudo desactivar el distrito", exito: ([u], a) => ["Distrito desactivado", distrito(a, u)] },
  crearComunidad: { error: "No se pudo crear la comunidad", exito: ([d]) => ["Comunidad creada", d.nombre] },
  activarComunidad: { error: "No se pudo activar la comunidad", exito: ([id], _a, d) => ["Comunidad activada", comunidad(d, id)] },
  desactivarComunidad: { error: "No se pudo desactivar la comunidad", exito: ([id], _a, d) => ["Comunidad desactivada", comunidad(d, id)] },
  eliminarComunidad: { error: "No se pudo eliminar la comunidad", exito: ([id], a) => ["Comunidad eliminada", comunidad(a, id)] },
});
