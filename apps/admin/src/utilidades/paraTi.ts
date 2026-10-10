import { Publicacion } from "@app-vecinos/tipos";
import { urlCompleta } from "./media";

/** Para ti en el panel (decisiones 0091 y 0092): utilidades que comparten sus pantallas. */

export type EstadoVisible = "publicada" | "programada" | "borrador";

export const estadoDe = (p: Publicacion): EstadoVisible => (p.estado === "borrador" ? "borrador" : p.programada ? "programada" : "publicada");

export const NOMBRE_ESTADO: Record<EstadoVisible, string> = { publicada: "Publicada", programada: "Programada", borrador: "Borrador" };

export const NOMBRE_TIPO: Record<Publicacion["tipo"], string> = { fotos: "Fotos", video: "Video", youtube: "YouTube", texto: "Texto" };

export const estaDestacada = (p: Publicacion) => Boolean(p.estado === "publicada" && p.destacadaHasta && new Date(p.destacadaHasta) > new Date());

/** Destacadas vigentes en el orden en que salen en la app. */
export function destacadasEnOrden(publicaciones: Publicacion[]): Publicacion[] {
  return publicaciones
    .filter(estaDestacada)
    .sort((a, b) => (a.destacadaOrden ?? 1e9) - (b.destacadaOrden ?? 1e9) || (b.publicadoEn ?? "").localeCompare(a.publicadoEn ?? ""));
}

/** La imagen que la representa (primera foto, portada o miniatura de YouTube); null en texto o video sin portada. */
export function miniaturaDe(p: Publicacion): string | null {
  if (p.tipo === "fotos") return urlCompleta(p.fotos[0]) ?? null;
  if (p.tipo === "video") return urlCompleta(p.portadaUrl) ?? null;
  if (p.tipo === "youtube") return p.enlaceMiniatura;
  return null;
}

/** "hoy", "1 día", "5 días": lo que le queda a una destacada. */
export function quedaDestacada(hasta: string): { texto: string; urgente: boolean } {
  const horas = (new Date(hasta).getTime() - Date.now()) / 3600e3;
  if (horas < 24) return { texto: horas < 1 ? "menos de 1 h" : `${Math.round(horas)} h`, urgente: true };
  const dias = Math.round(horas / 24);
  return { texto: dias === 1 ? "1 día" : `${dias} días`, urgente: false };
}

export const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });

export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : d < 7 ? `hace ${d} días` : fechaCorta(iso);
}

export const miles = (n: number) => n.toLocaleString("es-PE");

/** Fondo para las publicaciones de solo texto (siempre el mismo para la misma publicación). */
const FONDOS_TEXTO = ["#2f4a5e", "#3f5f3a", "#5b4a99", "#7a4a2a", "#2f6b6b", "#6b3f5a"];
export function fondoTexto(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FONDOS_TEXTO[h % FONDOS_TEXTO.length];
}

/** Iniciales y color para el avatar de un vecino. */
const COLORES_AVATAR = ["#8a4b2d", "#5b4a99", "#2f6b6b", "#7a5a1e", "#3f5f3a", "#2f4a5e", "#8a3b5c"];
export function avatarDe(nombre: string): { iniciales: string; color: string } {
  const partes = nombre.replace(/\./g, "").trim().split(/\s+/);
  const iniciales = ((partes[0]?.[0] ?? "V") + (partes[1]?.[0] ?? "")).toUpperCase();
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { iniciales, color: COLORES_AVATAR[h % COLORES_AVATAR.length] };
}
