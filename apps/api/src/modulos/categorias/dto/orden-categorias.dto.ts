import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from "class-validator";

/** Todas las categorías principales, en el orden en que deben salir en la app. */
export class OrdenCategoriasDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids!: string[];
}
