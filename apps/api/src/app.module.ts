import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { BaseDatosModule } from "./comun/base-datos/base-datos.module";
import { AuditoriaModule } from "./comun/auditoria/auditoria.module";
import { NotificacionesPushModule } from "./comun/notificaciones-push/notificaciones-push.module";
import { GeografiaModule } from "./modulos/geografia/geografia.module";
import { CategoriasModule } from "./modulos/categorias/categorias.module";
import { NegociosModule } from "./modulos/negocios/negocios.module";
import { AuthModule } from "./modulos/auth/auth.module";
import { CuentasModule } from "./modulos/cuentas/cuentas.module";
import { ContenidoModule } from "./modulos/contenido/contenido.module";
import { UsuariosModule } from "./modulos/usuarios/usuarios.module";
import { ProfesionalesModule } from "./modulos/profesionales/profesionales.module";
import { ServiciosAppModule } from "./modulos/servicios-app/servicios-app.module";
import { PublicidadModule } from "./modulos/publicidad/publicidad.module";
import { NovedadesModule } from "./modulos/novedades/novedades.module";
import { ArquetiposModule } from "./modulos/arquetipos/arquetipos.module";

// Etapa 2 cerrada: los 7 módulos que definía docs/tecnica/10-fases-pendientes.pdf ya existen.
// NovedadesModule y ArquetiposModule se sumaron después (ver docs/decisiones/0034-conexion-real-paneles.md)
// para terminar de conectar secciones del panel que hasta entonces solo vivían en memoria del navegador.
// El único que queda deliberadamente fuera del panel admin es `pagos` — su esquema vive en
// infraestructura/migraciones/0009_pagos_preparado.sql pero se activa recién cuando el modelo
// de ingresos esté validado (ver docs/decisiones/0005-esquema-base-de-datos.md).
@Module({
  imports: [
    // Límite general por IP para toda la API (100 peticiones / minuto) — sirve de red de
    // contención; las rutas sensibles (login, recuperación de clave) tienen además su propio
    // límite más estricto vía @Throttle() en cada controlador. Ver docs/tecnica/11-plan-seguridad.md.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),
    BaseDatosModule,
    AuditoriaModule,
    NotificacionesPushModule,
    AuthModule,
    CuentasModule,
    GeografiaModule,
    CategoriasModule,
    NegociosModule,
    ContenidoModule,
    UsuariosModule,
    ProfesionalesModule,
    ServiciosAppModule,
    PublicidadModule,
    NovedadesModule,
    ArquetiposModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
