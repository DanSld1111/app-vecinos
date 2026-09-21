import { IsIn, IsOptional } from "class-validator";
import { PaginacionAdminDto } from "../../../comun/dto/paginacion-admin.dto";

/**
 * Extiende la paginación común solo para GET /negocios/admin — el resto de listados admin
 * (cuentas, usuarios) no necesita "ver archivados", así que no se agregó ahí. El
 * ValidationPipe global rechaza cualquier propiedad no declarada (`forbidNonWhitelisted`),
 * por eso hacía falta un DTO propio en vez de leer el query param aparte.
 */
export class ListarNegociosAdminDto extends PaginacionAdminDto {
  @IsOptional()
  @IsIn(["true", "false"])
  archivados?: string;
}
