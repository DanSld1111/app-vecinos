"""
Genera los íconos y splash screens estáticos para "Agregar a inicio" en iPhone/Android,
a partir de assets/icon.png (1024x1024, ya con el isotipo ELISUR sobre fondo verde).
Salida: public/ (Expo copia ese contenido tal cual al build web — igual que "public/" en
Create React App).

Uso: python generar-pwa-assets.py
"""
import os
from PIL import Image

RAIZ = os.path.dirname(os.path.abspath(__file__))
ICONO_FUENTE = os.path.join(RAIZ, "assets", "icon.png")
SALIDA = os.path.join(RAIZ, "public")
VERDE_MARCA = (26, 83, 26)  # #1a531a

os.makedirs(SALIDA, exist_ok=True)
icono = Image.open(ICONO_FUENTE).convert("RGBA")

def guardar_icono_cuadrado(tamano, nombre, relleno=0.0):
    """Reescala el icono a tamano x tamano; relleno = fracción de margen adicional (para maskable)."""
    lienzo = Image.new("RGBA", (tamano, tamano), VERDE_MARCA + (255,))
    interior = int(tamano * (1 - relleno * 2))
    icono_r = icono.resize((interior, interior), Image.LANCZOS)
    pos = ((tamano - interior) // 2, (tamano - interior) // 2)
    lienzo.paste(icono_r, pos, icono_r)
    lienzo.convert("RGB").save(os.path.join(SALIDA, nombre), "PNG")
    print(f"  {nombre} ({tamano}x{tamano})")

print("Íconos:")
guardar_icono_cuadrado(180, "apple-touch-icon.png")
guardar_icono_cuadrado(192, "icon-192.png")
guardar_icono_cuadrado(512, "icon-512.png")
guardar_icono_cuadrado(512, "icon-512-maskable.png", relleno=0.1)  # margen de seguridad para el recorte circular/redondeado de Android

# ---- Splash screens iOS: Apple exige una imagen EXACTA por tamaño de pantalla (no hay
# forma de usar una sola imagen genérica) — cubrimos los tamaños de los iPhone activos hoy. ----
TAMANOS_SPLASH = [
    (1290, 2796),  # iPhone 15/16 Pro Max, 14 Pro Max
    (1179, 2556),  # iPhone 15/16 Pro, 15/16, 14 Pro
    (1170, 2532),  # iPhone 13/14, 12/13 Pro
    (1284, 2778),  # iPhone 12/13/14 Pro Max
    (1125, 2436),  # iPhone X/XS/11 Pro
    (1242, 2688),  # iPhone XS Max/11 Pro Max
    (828, 1792),   # iPhone 11/XR
    (1242, 2208),  # iPhone 8 Plus (todavía en uso)
    (750, 1334),   # iPhone SE/8
]

print("Splash screens:")
for ancho, alto in TAMANOS_SPLASH:
    lienzo = Image.new("RGBA", (ancho, alto), VERDE_MARCA + (255,))
    lado = int(min(ancho, alto) * 0.32)
    icono_r = icono.resize((lado, lado), Image.LANCZOS)
    pos = ((ancho - lado) // 2, (alto - lado) // 2)
    lienzo.paste(icono_r, pos, icono_r)
    nombre = f"splash-{ancho}x{alto}.png"
    lienzo.convert("RGB").save(os.path.join(SALIDA, nombre), "PNG")
    print(f"  {nombre}")

print("Listo.")
