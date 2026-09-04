import { useLocalSearchParams } from "expo-router";
import { GuiaListado } from "../../../src/componentes/GuiaListado";

export default function GuiaNegocios() {
  const { categoriaId } = useLocalSearchParams<{ categoriaId?: string }>();
  return <GuiaListado mostrarFiltroCategorias categoriaIdFija={categoriaId} />;
}
