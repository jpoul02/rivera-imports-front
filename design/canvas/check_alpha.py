import base64
import re
from io import BytesIO
from pathlib import Path

from PIL import Image

SRC = Path(r"c:\Users\Datasys2\Documents\rivera-imports\frontend\public\pickup.svg")
svg_text = SRC.read_text(encoding="utf-8", errors="ignore")
match = re.search(r'xlink:href="data:image/(png|jpeg);base64,([^"]+)"', svg_text)
print("match:", bool(match))
raw = base64.b64decode(match.group(2))
im = Image.open(BytesIO(raw))
print("mode:", im.mode, "size:", im.size)
