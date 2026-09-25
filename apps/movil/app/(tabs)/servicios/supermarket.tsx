import { GuiaListado } from "../../../src/componentes/GuiaListado";

export default function Supermarket() {
  return (
    <GuiaListado
      servicioSlugFijo="supermarket"
      titulo="Supermarket"
      subtitulo="Ofertas y productos cerca de ti"
      placeholderBusqueda="Buscar supermercado…"
    />
  );
}
