// Al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.
export const REGEX_CONTRASENA_SEGURA = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
export const MENSAJE_CONTRASENA_SEGURA =
  "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.";
