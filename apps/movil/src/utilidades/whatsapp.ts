import { Linking } from "react-native";

/**
 * wa.me necesita el número con código de país, pero los celulares peruanos se guardan muchas veces
 * sin él (9 dígitos que empiezan con 9): a esos se les agrega el 51. `null` si no hay número.
 */
export function enlaceWhatsapp(numero: string | null | undefined, texto?: string): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const completo = digitos.length === 9 && digitos.startsWith("9") ? `51${digitos}` : digitos;
  return `https://wa.me/${completo}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/** Abre el chat con el mensaje ya escrito. Devuelve false si no hay número. */
export function abrirWhatsapp(numero: string | null | undefined, texto?: string): boolean {
  const url = enlaceWhatsapp(numero, texto);
  if (!url) return false;
  Linking.openURL(url);
  return true;
}
