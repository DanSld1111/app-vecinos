import { entorno } from "../config/entorno";
import { RepositorioAvisos } from "./contratos/repositorioAvisos";
import { RepositorioCategorias } from "./contratos/repositorioCategorias";
import { RepositorioComunidades } from "./contratos/repositorioComunidades";
import { RepositorioNegocios } from "./contratos/repositorioNegocios";
import { RepositorioProductos } from "./contratos/repositorioProductos";
import { RepositorioServicios } from "./contratos/repositorioServicios";
import { RepositorioAnuncios } from "./contratos/repositorioAnuncios";
import { RepositorioNovedades } from "./contratos/repositorioNovedades";
import { RepositorioAvisosMock } from "./mock/repositorioAvisos.mock";
import { RepositorioCategoriasMock } from "./mock/repositorioCategorias.mock";
import { RepositorioComunidadesMock } from "./mock/repositorioComunidades.mock";
import { RepositorioNegociosMock } from "./mock/repositorioNegocios.mock";
import { RepositorioProductosMock } from "./mock/repositorioProductos.mock";
import { RepositorioServiciosMock } from "./mock/repositorioServicios.mock";
import { RepositorioAnunciosMock } from "./mock/repositorioAnuncios.mock";
import { RepositorioNovedadesMock } from "./mock/repositorioNovedades.mock";
import { RepositorioAvisosApi } from "./api/repositorioAvisos.api";
import { RepositorioCategoriasApi } from "./api/repositorioCategorias.api";
import { RepositorioComunidadesApi } from "./api/repositorioComunidades.api";
import { RepositorioNegociosApi } from "./api/repositorioNegocios.api";
import { RepositorioProductosApi } from "./api/repositorioProductos.api";
import { RepositorioServiciosApi } from "./api/repositorioServicios.api";
import { RepositorioAnunciosApi } from "./api/repositorioAnuncios.api";
import { RepositorioNovedadesApi } from "./api/repositorioNovedades.api";

const esApi = entorno.fuenteDeDatos === "api";

function crearRepositorioNegocios(): RepositorioNegocios {
  return esApi ? new RepositorioNegociosApi() : new RepositorioNegociosMock();
}

function crearRepositorioComunidades(): RepositorioComunidades {
  return esApi ? new RepositorioComunidadesApi() : new RepositorioComunidadesMock();
}

function crearRepositorioCategorias(): RepositorioCategorias {
  return esApi ? new RepositorioCategoriasApi() : new RepositorioCategoriasMock();
}

function crearRepositorioAvisos(): RepositorioAvisos {
  return esApi ? new RepositorioAvisosApi() : new RepositorioAvisosMock();
}

function crearRepositorioProductos(): RepositorioProductos {
  return esApi ? new RepositorioProductosApi() : new RepositorioProductosMock();
}

function crearRepositorioServicios(): RepositorioServicios {
  return esApi ? new RepositorioServiciosApi() : new RepositorioServiciosMock();
}

export const repositorioNegocios = crearRepositorioNegocios();
export const repositorioComunidades = crearRepositorioComunidades();
export const repositorioCategorias = crearRepositorioCategorias();
export const repositorioAvisos = crearRepositorioAvisos();
export const repositorioProductos = crearRepositorioProductos();
function crearRepositorioAnuncios(): RepositorioAnuncios {
  return esApi ? new RepositorioAnunciosApi() : new RepositorioAnunciosMock();
}

export const repositorioServicios = crearRepositorioServicios();
export const repositorioAnuncios = crearRepositorioAnuncios();

function crearRepositorioNovedades(): RepositorioNovedades {
  return esApi ? new RepositorioNovedadesApi() : new RepositorioNovedadesMock();
}

export const repositorioNovedades = crearRepositorioNovedades();
