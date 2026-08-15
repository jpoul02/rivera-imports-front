"""pickup.svg es en realidad un PNG en base64 envuelto en <image> dentro de
filtros SVG (mismo patrón que logo.svg) — por eso pesa 6.2MB para una foto
que debería pesar unos cientos de KB. Este script extrae el raster embebido,
lo reduce de tamaño/calidad, y lo guarda como PNG suelto.
"""

import base64
import re
from io import BytesIO
from pathlib import Path

from PIL import Image

SRC = Path(r"c:\Users\Datasys2\Documents\rivera-imports\frontend\public\pickup.svg")
OUT = Path(r"c:\Users\Datasys2\Documents\rivera-imports\frontend\public\pickup-optimizado.png")

svg_text = SRC.read_text(encoding="utf-8", errors="ignore")

match = re.search(r'xlink:href="data:image/(png|jpeg);base64,([^"]+)"', svg_text)
if not match:
    raise SystemExit("No se encontró una imagen base64 embebida en el SVG")

img_format, b64_data = match.group(1), match.group(2)
raw = base64.b64decode(b64_data)
print(f"Imagen embebida original: {len(raw) / 1024:.0f} KB ({img_format})")

im = Image.open(BytesIO(raw)).convert("RGB")
print("Dimensiones originales:", im.size)

MAX_DIM = 900
if max(im.size) > MAX_DIM:
    ratio = MAX_DIM / max(im.size)
    im = im.resize((int(im.width * ratio), int(im.height * ratio)), Image.LANCZOS)

im.save(OUT, "PNG", optimize=True)
print("Guardado:", OUT, f"{OUT.stat().st_size / 1024:.0f} KB", im.size)
print("Original pickup.svg:", f"{SRC.stat().st_size / 1024 / 1024:.1f} MB")
