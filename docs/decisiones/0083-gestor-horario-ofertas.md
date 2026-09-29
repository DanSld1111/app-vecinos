# 0083 — El gestor de negocios también edita horario y ofertas

## Contexto

La decisión 0071 dejó horario y ofertas solo para el dueño del negocio y el super_admin: el
gestor era un rol administrativo (alta y vínculo con el dueño). En la práctica, si el dueño no
usa el panel, nadie más que un super_admin podía poner el horario de un negocio.

## Decisión

- `gestor_negocios` edita horario y ofertas de cualquier negocio (API:
  `verificarGestionOperativa` en `negocios.service.ts`; panel: pestañas Horario y Ofertas en la
  ficha del negocio).
- Sigue sin poder publicar, despublicar ni rechazar (validador de contenido), ni entrar a los
  módulos de configuración general (Categorías, Fichas, Servicios, Avisos, Publicidad,
  Validación, Cuentas, Usuarios, Distritos). Solo crea cuentas de "dueño de negocio".
