import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useConectividad() {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    const desuscribir = NetInfo.addEventListener((estado) => {
      setConectado(estado.isConnected !== false);
    });
    return () => desuscribir();
  }, []);

  return conectado;
}
