import { ArrayMinSize, IsArray, IsString } from "class-validator";

/**
 * Reordenar dentro de una sección: el cliente manda los ids en el orden final que quedó tras
 * arrastrar, y el servidor les asigna 0..n. Mandar la lista completa (en vez de "subir uno") es
 * lo que evita que dos ediciones simultáneas dejen el orden inconsistente.
 */
export class ReordenarProductosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  idsEnOrden!: string[];
}
