import { SetMetadata } from "@nestjs/common";
import { RolCuenta } from "@app-vecinos/tipos";

export const CLAVE_ROLES = "roles";

/** Restringe un endpoint a los roles indicados. Requiere usarse junto a JwtAuthGuard y RolesGuard. */
export const Roles = (...roles: RolCuenta[]) => SetMetadata(CLAVE_ROLES, roles);
