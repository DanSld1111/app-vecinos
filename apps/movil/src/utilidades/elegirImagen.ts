import * as ImagePicker from "expo-image-picker";
import { ArchivoImagen } from "../datos/api/clienteApi";

/**
 * Abre el selector de fotos del dispositivo y devuelve la imagen elegida en el formato que
 * espera `apiSubirArchivo`. `null` si el usuario canceló o no dio permiso — quien llama no
 * necesita distinguir el motivo, solo no seguir con la subida.
 */
export async function elegirImagen(): Promise<ArchivoImagen | null> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return null;

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });
  if (resultado.canceled || !resultado.assets[0]) return null;

  const asset = resultado.assets[0];
  return { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType, file: asset.file };
}
