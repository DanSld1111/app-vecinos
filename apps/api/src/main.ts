import "reflect-metadata";
import "dotenv/config";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { validarEntorno } from "./comun/validar-entorno";

async function bootstrap() {
  // Antes de crear la app: si los secretos de JWT no están bien configurados, ni siquiera
  // arranca — ver docs/tecnica/11-plan-seguridad.md (hallazgo #1).
  validarEntorno();

  // Adaptador explícito en vez de dejar que NestFactory lo autodetecte: en este monorepo
  // (workspaces de npm), @nestjs/platform-express puede terminar instalado en
  // apps/api/node_modules en vez de en el node_modules raíz — la autodetección de
  // NestFactory.create(AppModule) no lo encuentra ahí y falla con "No driver (HTTP) has been
  // selected" aunque el paquete sí esté instalado. Pasarlo a mano evita depender de esa
  // detección. El genérico <NestExpressApplication> habilita useStaticAssets() abajo.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter());

  // Sirve las fotos subidas (apps/api/uploads/) — almacenamiento local de paso, ver
  // foto-negocio.config.ts. Fuera del prefijo /v1 a propósito: son archivos estáticos,
  // no rutas de la API, y foto_principal_url ya se guarda como "/uploads/negocios/...".
  app.useStaticAssets(join(__dirname, "..", "uploads"), { prefix: "/uploads/" });

  // Cabeceras de seguridad estándar (protección contra sniffing de MIME, clickjacking, etc.)
  app.use(helmet());

  // apps/admin y apps/movil corren en orígenes distintos al de la API — restringido a la
  // lista real en vez de abierto a cualquiera (ver docs/tecnica/11-plan-seguridad.md,
  // hallazgo #3). En producción, definir CORS_ORIGENES_PERMITIDOS con los dominios reales
  // separados por coma; sin definir, se usa esta lista de puertos locales típicos de
  // desarrollo (Vite/Expo con autoPort pueden variar de puerto, por eso varios).
  const origenesPermitidos = (
    process.env.CORS_ORIGENES_PERMITIDOS?.trim() ||
    "http://localhost:5183,http://localhost:8081,http://localhost:8082,http://localhost:19006"
  )
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenesPermitidos });

  // docs/tecnica/05-api-contrato.yaml y apps/movil/src/config/entorno.ts ya asumían este
  // prefijo (apiUrl: ".../v1") desde Etapa 0 — faltaba aplicarlo en el servidor real.
  app.setGlobalPrefix("v1");

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);
  // eslint-disable-next-line no-console
  console.log(`API ELISUR escuchando en el puerto ${puerto}`);
}

bootstrap();
