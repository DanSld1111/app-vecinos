import { Aviso } from "@app-vecinos/tipos";

type AvisoSemilla = Omit<Aviso, "estado" | "creadoPorCuentaId" | "validadoPorCuentaId" | "motivoRechazo">;

const avisosSemilla: AvisoSemilla[] = [
  {
    id: "aviso-corte-agua",
    comunidadId: "com-san-borja",
    fuenteNombre: "Sedapal",
    fuenteVerificada: true,
    titulo: "Corte de agua programado",
    cuerpo:
      "Sedapal informa corte de agua el jueves 28 de agosto de 9:00 a 17:00 en las cuadras 20-24 de Av. San Luis por mantenimiento de la red.",
    categoria: "municipal",
    publicadoEn: "2026-08-24",
    imagenUrl: null,
    meGusta: 12,
    compartidos: 5,
  },
  {
    id: "aviso-junta-vecinal",
    comunidadId: "com-san-borja",
    fuenteNombre: "Junta Vecinal Reducto N.° 2",
    fuenteVerificada: false,
    titulo: "Reunión de la junta vecinal",
    cuerpo:
      "Este sábado 30 de agosto, 10:00 a.m., en el parque Reducto N.° 2. Se tratará seguridad y mantenimiento de áreas verdes.",
    categoria: "junta_vecinal",
    publicadoEn: "2026-08-23",
    imagenUrl: null,
    meGusta: 8,
    compartidos: 2,
  },
  {
    id: "aviso-vacunacion",
    comunidadId: "com-san-borja",
    fuenteNombre: "Municipalidad de San Borja",
    fuenteVerificada: true,
    titulo: "Campaña de vacunación antirrábica",
    cuerpo:
      "La Municipalidad de San Borja vacuna gratis a perros y gatos el domingo 31 de agosto en la Plaza Grau, de 9:00 a 13:00.",
    categoria: "municipal",
    publicadoEn: "2026-08-22",
    imagenUrl: null,
    meGusta: 34,
    compartidos: 15,
  },
  {
    id: "aviso-seguridad",
    comunidadId: "com-san-borja",
    fuenteNombre: "Serenazgo San Borja",
    fuenteVerificada: true,
    titulo: "Refuerzo de serenazgo en zona norte",
    cuerpo:
      "Serenazgo aumentó las rondas nocturnas entre Av. Aviación y Av. Angamos Este tras reportes de vecinos. Reporta cualquier incidente al 105.",
    categoria: "seguridad",
    publicadoEn: "2026-08-20",
    imagenUrl: null,
    meGusta: 21,
    compartidos: 9,
  },
];

export const avisosMock: Aviso[] = avisosSemilla.map((aviso) => ({
  ...aviso,
  estado: "publicado",
  creadoPorCuentaId: "cuenta-super-admin",
  validadoPorCuentaId: "cuenta-super-admin",
  motivoRechazo: null,
}));
