import { GuiaListado } from "../../../src/componentes/GuiaListado";

export default function GuiaRestaurantes() {
  return (
    <GuiaListado
      servicioSlugFijo="restaurantes"
      titulo="Restaurantes"
      subtitulo="Cartas y menús cerca de ti"
      placeholderBusqueda="Buscar restaurante o plato…"
    />
  );
}
