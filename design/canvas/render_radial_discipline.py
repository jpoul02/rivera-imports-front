"""Radial Discipline — canvas render for the Rivera Imports catalog hero.

Supersampled (4x) render for clean anti-aliased lines, downscaled at the end.
"""

import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

random.seed(42)
np.random.seed(42)

SS = 4
FINAL = 1600
W = H = FINAL * SS

BG = (12, 12, 15)  # carbon
STROKE = (150, 150, 158)
STROKE_DIM = (95, 95, 102)
RED = (214, 39, 39)
WHITE_SOFT = (225, 225, 228)

FONT_DIR = r"C:\Windows\Fonts"


def font(name, size):
    return ImageFont.truetype(f"{FONT_DIR}\\{name}", size)


# NOTA: los .ttf descargados por el instalador de skills (canvas-fonts/) llegaron
# corruptos (bytes binarios mangled a UTF-8, cada byte no-ascii se volvió U+FFFD) —
# se usan fuentes mono del sistema en su lugar.
mono_reg = lambda size: font("consola.ttf", size)
mono_bold = lambda size: font("consolab.ttf", size)


def s(v):
    """scale a final-px value to supersampled px"""
    return int(v * SS)


img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# ---- subtle grain -----------------------------------------------------
noise = (np.random.rand(FINAL, FINAL) * 14 - 7).astype(np.int16)
base = np.array(Image.new("L", (FINAL, FINAL), 12), dtype=np.int16)
grain = np.clip(base + noise, 0, 255).astype(np.uint8)
grain_img = Image.fromarray(grain, mode="L").convert("RGB").resize((W, H), Image.NEAREST)
img = Image.blend(img, grain_img, alpha=0.09)
draw = ImageDraw.Draw(img, "RGBA")

# ---- soft vignette (depth at the edges) ---------------------------------
# Image.radial_gradient("L") is bright (255) at the centre, fading to 0 at
# the edge — invert that so the edges get darkened, centre untouched.
grad = Image.radial_gradient("L").resize((FINAL, FINAL))
grad = Image.eval(grad, lambda p: int((255 - p) * 0.35))
vig_rgb = Image.merge("RGB", (grad, grad, grad)).resize((W, H), Image.LANCZOS)
img = ImageChops.subtract(img, vig_rgb)
draw = ImageDraw.Draw(img, "RGBA")

# ---- faint blueprint grid ----------------------------------------------
grid_step = s(64)
grid_col = (255, 255, 255, 8)
for x in range(0, W, grid_step):
    draw.line([(x, 0), (x, H)], fill=grid_col, width=1)
for y in range(0, H, grid_step):
    draw.line([(0, y), (W, y)], fill=grid_col, width=1)

# ---- centre -------------------------------------------------------------
cx, cy = s(FINAL * 0.42), s(FINAL * 0.50)

R_OUT = s(430)
R2 = s(378)
R3 = s(330)
R_HUB = s(122)
R_DOT = s(20)

lw = s(1.6)
lw_thin = s(0.9)


def ring(r, width=lw, color=STROKE, alpha=255):
    c = (*color, alpha)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=width)


ring(R_OUT, width=s(2.2))
ring(R2, width=lw_thin, color=STROKE_DIM, alpha=160)
ring(R3, width=lw_thin, color=STROKE_DIM, alpha=160)
ring(R_HUB, width=s(2.2))
draw.ellipse([cx - R_DOT, cy - R_DOT, cx + R_DOT, cy + R_DOT], outline=(*RED, 235), width=s(2.4))
draw.ellipse([cx - s(4), cy - s(4), cx + s(4), cy + s(4)], fill=(*RED, 255))

# ---- outer tick band (dial) --------------------------------------------
for deg in range(0, 360, 3):
    a = math.radians(deg)
    long_tick = deg % 15 == 0
    r1 = R_OUT + s(6)
    r2t = R_OUT + (s(20) if long_tick else s(10))
    x1, y1 = cx + r1 * math.cos(a), cy + r1 * math.sin(a)
    x2, y2 = cx + r2t * math.cos(a), cy + r2t * math.sin(a)
    alpha = 190 if long_tick else 90
    width = s(1.6) if long_tick else s(0.8)
    draw.line([(x1, y1), (x2, y2)], fill=(*STROKE, alpha), width=width)

# ---- inner vent spokes ---------------------------------------------------
n_spokes = 56
for i in range(n_spokes):
    a = math.radians(i * (360 / n_spokes))
    x1, y1 = cx + R3 * math.cos(a), cy + R3 * math.sin(a)
    x2, y2 = cx + R2 * math.cos(a), cy + R2 * math.sin(a)
    draw.line([(x1, y1), (x2, y2)], fill=(*STROKE_DIM, 130), width=s(0.9))

# ---- lug holes on hub ring ------------------------------------------------
for i in range(5):
    a = math.radians(i * 72 - 90)
    hx, hy = cx + (R_HUB * 0.62) * math.cos(a), cy + (R_HUB * 0.62) * math.sin(a)
    hr = s(9)
    draw.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], outline=(*STROKE, 220), width=s(1.6))

# ---- vertical dimension line (left of the ring) --------------------------
dim_x = cx - R_OUT - s(90)
top_y = cy - R_OUT
bot_y = cy + R_OUT
draw.line([(dim_x, top_y), (dim_x, bot_y)], fill=(*STROKE, 160), width=s(1.2))
cap = s(9)
draw.line([(dim_x - cap, top_y), (dim_x + cap, top_y)], fill=(*STROKE, 160), width=s(1.2))
draw.line([(dim_x - cap, bot_y), (dim_x + cap, bot_y)], fill=(*STROKE, 160), width=s(1.2))

dim_label = "\u00d8 1040"
f_dim = mono_reg(s(15))
rot = Image.new("RGBA", (s(160), s(30)), (0, 0, 0, 0))
rd = ImageDraw.Draw(rot)
rd.text((0, 0), dim_label, font=f_dim, fill=(*WHITE_SOFT, 210))
rot = rot.rotate(90, expand=True)
img.paste(rot, (dim_x - s(46), (top_y + bot_y) // 2 - rot.size[1] // 2), rot)

# ---- exploded fragment, leader line, numbered callout ---------------------
lead_angle = math.radians(-52)
lx1, ly1 = cx + R_OUT * math.cos(lead_angle), cy + R_OUT * math.sin(lead_angle)
frag_cx = cx + s(760) * math.cos(lead_angle) * 0.62 + s(60)
frag_cy = cy + s(760) * math.sin(lead_angle) * 0.62 - s(40)

dash_len, gap_len = s(10), s(8)
dx, dy = frag_cx - lx1, frag_cy - ly1
dist = math.hypot(dx, dy)
steps = int(dist / (dash_len + gap_len))
ux, uy = dx / dist, dy / dist
for i in range(steps):
    sx = lx1 + ux * i * (dash_len + gap_len)
    sy = ly1 + uy * i * (dash_len + gap_len)
    ex = sx + ux * dash_len
    ey = sy + uy * dash_len
    draw.line([(sx, sy), (ex, ey)], fill=(*STROKE, 150), width=s(1.1))

# fragment: rounded bracket (caliper-esque), matches brand's exploded-caliper motif
fw, fh = s(150), s(210)
fx0, fy0 = frag_cx - fw / 2, frag_cy - fh / 2
draw.rounded_rectangle(
    [fx0, fy0, fx0 + fw, fy0 + fh], radius=s(18), outline=(*STROKE, 220), width=s(2.0)
)
bolt_r = s(11)
for bx in (fx0 + fw * 0.28, fx0 + fw * 0.72):
    by = fy0 + fh * 0.24
    draw.ellipse([bx - bolt_r, by - bolt_r, bx + bolt_r, by + bolt_r], outline=(*STROKE, 220), width=s(1.6))
piston_r = s(16)
draw.ellipse(
    [frag_cx - piston_r, fy0 + fh * 0.62 - piston_r, frag_cx + piston_r, fy0 + fh * 0.62 + piston_r],
    outline=(*STROKE, 200),
    width=s(1.8),
)

# numbered callout
call_r = s(17)
call_x, call_y = frag_cx, fy0 - s(28)
draw.ellipse([call_x - call_r, call_y - call_r, call_x + call_r, call_y + call_r], outline=(*RED, 235), width=s(1.8))
f_call = mono_bold(s(14))
bbox = draw.textbbox((0, 0), "01", font=f_call)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((call_x - tw / 2, call_y - th / 2 - bbox[1]), "01", font=f_call, fill=(*WHITE_SOFT, 235))

f_ref = mono_reg(s(12))
draw.text((frag_cx - s(38), fy0 + fh + s(14)), "SEC. 04\u2013A", font=f_ref, fill=(*STROKE, 190))

# ---- corner mark ----------------------------------------------------------
f_corner = mono_reg(s(13))
label = "RIVERA IMPORTS \u2014 CAT\u00c1LOGO"
draw.text((s(48), H - s(64)), label, font=f_corner, fill=(*STROKE, 160))

# corner registration ticks
for (rx, ry) in [(s(40), s(40)), (W - s(40), s(40)), (s(40), H - s(40)), (W - s(40), H - s(40))]:
    m = s(9)
    draw.line([(rx - m, ry), (rx + m, ry)], fill=(*STROKE_DIM, 130), width=s(1))
    draw.line([(rx, ry - m), (rx, ry + m)], fill=(*STROKE_DIM, 130), width=s(1))

# ---- downscale with high-quality filter -----------------------------------
final_img = img.resize((FINAL, FINAL), Image.LANCZOS)
final_img = final_img.filter(ImageFilter.SMOOTH_MORE)

out_path = r"C:\Users\Datasys2\Documents\rivera-imports\frontend\design\canvas\radial-discipline-hero.png"
final_img.save(out_path, "PNG")
print("saved", out_path, final_img.size)
