import { AtributoProductoDef, Producto, SalidaTour, salidasProximas, valoresVarias } from "@app-vecinos/tipos";
import { urlCompleta } from "../../utilidades/media";

/** Fichas Inmuebles y Tours (decisión 0096): lo que comparten. */

/** Portada + fotos extra, ya con URL completa. */
export function fotosDe(p: Producto): string[] {
  return [p.fotoUrl, ...(p.fotos ?? [])].filter((f): f is string => Boolean(f)).map((f) => urlCompleta(f)!);
}

const visibles = (campos: AtributoProductoDef[]) => campos.filter((c) => !c.oculto);

/** "3 dormitorios", "1 baño", "120 m²": un campo Número con su valor. */
export function textoNumero(campo: AtributoProductoDef, valor: string): string {
  if (campo.unidad) return `${valor} ${campo.unidad}`;
  const etiqueta = campo.etiqueta.toLowerCase();
  return `${valor} ${valor === "1" ? etiqueta.replace(/s$/, "") : etiqueta}`;
}

/** Los campos Número que tiene el producto, en el orden de la categoría. */
export function numerosDe(p: Producto, campos: AtributoProductoDef[]): { campo: AtributoProductoDef; valor: string }[] {
  return visibles(campos)
    .filter((c) => c.tipo === "numero" && p.atributos?.[c.clave]?.trim())
    .map((c) => ({ campo: c, valor: p.atributos[c.clave].trim() }));
}

/** Todas las opciones marcadas en los campos "Varias" (características). */
export function caracteristicasDe(p: Producto, campos: AtributoProductoDef[]): string[] {
  return visibles(campos)
    .filter((c) => c.tipo === "varias")
    .flatMap((c) => valoresVarias(p.atributos?.[c.clave]));
}

/** Campos de una opción o texto con valor (tipo de inmueble, duración, idioma…). */
export function datosDe(p: Producto, campos: AtributoProductoDef[]): { campo: AtributoProductoDef; valor: string }[] {
  return visibles(campos)
    .filter((c) => (c.tipo === "opciones" || c.tipo === "texto") && p.atributos?.[c.clave]?.trim())
    .map((c) => ({ campo: c, valor: p.atributos[c.clave].trim() }));
}

/** Los campos con filtro: el primero va en botones grandes (Venta / Alquiler), el segundo en chips. */
export function camposFiltro(campos: AtributoProductoDef[]): AtributoProductoDef[] {
  return visibles(campos).filter((c) => c.filtro && c.tipo === "opciones" && (c.opciones?.length ?? 0) > 1);
}

/** Área en m² (para el precio por m²): el primer campo Número con unidad m². */
export function areaM2(p: Producto, campos: AtributoProductoDef[]): number | null {
  const campo = visibles(campos).find((c) => c.tipo === "numero" && /m\s*²|m2/i.test(c.unidad ?? ""));
  const valor = campo ? Number((p.atributos?.[campo.clave] ?? "").replace(",", ".")) : NaN;
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

/** "2026-10-25" → { dia: "Sáb", fecha: "25 oct" }. */
export function partesFecha(iso: string): { dia: string; fecha: string } {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d);
  return { dia: DIAS[f.getDay()], fecha: `${d} ${MESES[m - 1]}` };
}

/** "04:30" → "4:30 a. m." */
export function horaLegible(hora: string): string {
  const [h, min] = hora.split(":").map(Number);
  if (!Number.isFinite(h)) return hora;
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min || 0).padStart(2, "0")} ${sufijo}`;
}

export const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function proximasSalidas(p: Producto): SalidaTour[] {
  return salidasProximas(p.detalle, hoyLocal());
}

/** "Quedan 3 cupos" si quedan pocos; "Cupos disponibles" si hay; "" sin dato. */
export function textoCupos(s: SalidaTour | undefined): { texto: string; pocos: boolean } {
  if (!s || s.cupos === null || s.cupos === undefined) return { texto: s ? "Cupos disponibles" : "", pocos: false };
  if (s.cupos === 0) return { texto: "Agotado", pocos: true };
  if (s.cupos <= 8) return { texto: s.cupos === 1 ? "Queda 1 cupo" : `Quedan ${s.cupos} cupos`, pocos: true };
  return { texto: "Cupos disponibles", pocos: false };
}
