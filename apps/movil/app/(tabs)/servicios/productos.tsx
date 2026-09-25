import { GuiaListado } from "../../../src/componentes/GuiaListado";

export default function GuiaProductos() {
  return (
    <GuiaListado
      servicioSlugFijo="market-space"
      mostrarFiltroCategorias
      titulo="Market Space"
      subtitulo="Moda, hogar y emprendimientos de tu zona"
      placeholderBusqueda="Buscar producto o tienda…"
    />
  );
}
