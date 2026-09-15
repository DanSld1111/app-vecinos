export const marca = {
  nombreApp: "ELISUR",
  nombreCorto: "ELISUR",
  dominio: "elisur.app",
  correoContacto: "contacto@elisur.app",
  colores: {
    primario: "#1a531a",
    secundario: "#123d13",
    acento: "#ef7148",
  },
  rutasDeRecursos: {
    logo: require("../../assets/logo-principal.png"),
    icono: require("../../assets/icono-app.png"),
    splash: require("../../assets/splash.png"),
  },
} as const;

export type Marca = typeof marca;
