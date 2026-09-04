import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolCuenta, Cuenta } from "@app-vecinos/tipos";
import { CLAVE_ROLES } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<RolCuenta[] | undefined>(CLAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

    const cuenta: Cuenta | undefined = contexto.switchToHttp().getRequest().user;
    if (!cuenta || !rolesPermitidos.includes(cuenta.rol)) {
      throw new ForbiddenException("Tu cuenta no tiene permiso para esta acción.");
    }
    return true;
  }
}
