import os as _os_mat
__MAT = _os_mat.path.abspath(_os_mat.path.join(_os_mat.path.dirname(__file__), '../..'))  # Wurzel: materials/
"""OBS-Seitenleisten (1920x1080, links transparent), Szenen-Skizzen und Thumbnails (1280x720) für die Videoreihe."""
import json, os, segno, io
from PIL import Image, ImageDraw, ImageFont
OUT = (__MAT + '/out/video/')
F = __MAT + '/fonts/'
def f(name, size): return ImageFont.truetype(F + name, size)
TEAL, DARK, OCK, TINT, WHITE, SAND = (14, 100, 85), (10, 74, 63), (178, 106, 15), (228, 240, 238), (255, 255, 255), (243, 217, 181)
BASE = 'https://automatenlab.frankjuchim.de/'
META = json.load(open(OUT + 'video_meta.json'))
os.makedirs(OUT + 'OBS', exist_ok=True); os.makedirs(OUT + 'Thumbnails', exist_ok=True); os.makedirs(OUT + 'Skizzen', exist_ok=True)

def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def corners(d, x0, y0, x1, y1, col, L=34, w=5):
    for (x, y, dx, dy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
        d.line([(x, y), (x + dx * L, y)], fill=col, width=w); d.line([(x, y), (x, y + dy * L)], fill=col, width=w)

def qr(route, px):
    b = io.BytesIO(); segno.make(BASE + route, error='m').save(b, kind='png', scale=10, border=2, dark='#0A4A3F'); b.seek(0)
    return Image.open(b).convert('RGB').resize((px, px), Image.NEAREST)

def label(v): return f"Extra {v['id'][1:]}" if v['id'].startswith('O') else f"Erklärvideo {v['id'][1:]}"

# ---------------------------------------------------------------- 1) OBS-Seitenleiste je Video
CAM = (1460, 790, 1900, 1037)   # 440 x 247 = 16:9
for v in META:
    im = Image.new('RGBA', (1920, 1080), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([1440, 0, 1920, 1080], fill=DARK + (255,))
    d.rectangle([1440, 0, 1446, 1080], fill=OCK + (255,))
    d.text((1475, 40), label(v).upper(), font=f('Carlito-Bold.ttf', 24), fill=SAND)
    y = 80
    for ln in wrap(d, v['title'], f('Caladea-Bold.ttf', 38), 410):
        d.text((1475, y), ln, font=f('Caladea-Bold.ttf', 38), fill=WHITE); y += 46
    y += 24
    d.text((1475, y), 'LIVE IM AUTOMATENLAB', font=f('Carlito-Bold.ttf', 22), fill=SAND); y += 40
    route = v['labs'][0] if v['labs'] else ''
    q = qr(route, 250); bg = Image.new('RGB', (290, 290), WHITE); bg.paste(q, (20, 20))
    im.paste(bg, (1535, y)); y += 305
    d.text((1475, y), 'automatenlab.frankjuchim.de', font=f('Carlito-Regular.ttf', 24), fill=(191, 217, 212))
    d.rectangle(CAM, fill=(8, 61, 52, 255)); corners(d, *CAM, SAND)
    # Kamerafläche transparent lassen? -> nein: dunkle Fläche, Kamera liegt darüber
    im.save(OUT + f"OBS/{v['id']}_Seitenleiste.png")

# ---------------------------------------------------------------- 2) Szenen-Skizzen für die Planung
def sketch(kind):
    W, H = 960, 540; im = Image.new('RGB', (W, H), (250, 250, 250)); d = ImageDraw.Draw(im)
    s = W / 1920
    fb, fs = f('Carlito-Bold.ttf', 26), f('Carlito-Regular.ttf', 21)
    if kind == 'A':
        d.rectangle([0, 0, W - 1, H - 1], outline=TEAL, width=3)
        d.rectangle([int(86 * s), int(50 * s), int(1834 * s), int(180 * s)], fill=TINT); d.text((int(100 * s), int(85 * s)), 'Folientitel', font=fb, fill=TEAL)
        d.rectangle([int(86 * s), int(210 * s), int(1325 * s), int(1000 * s)], fill=(236, 243, 241)); d.text((int(120 * s), int(560 * s)), 'Hauptfläche: Graph, Tabelle, Text', font=fb, fill=DARK)
        d.rectangle([int(1382 * s), int(210 * s), int(1886 * s), int(677 * s)], fill=TINT); d.text((int(1400 * s), int(400 * s)), 'Seitenleiste', font=fs, fill=DARK)
        x0, y0, x1, y1 = int(1382 * s), int(720 * s), int(1886 * s), int(1044 * s)
        d.rectangle([x0, y0, x1, y1], fill=(248, 236, 219)); corners(d, x0, y0, x1, y1, OCK, 16, 3)
        d.text((x0 + 40, y0 + 55), 'Kamera', font=fb, fill=OCK); d.text((x0 + 18, y0 + 90), 'max. 504 × 324 px', font=fs, fill=OCK)
        d.text((10, H - 30), 'Szene A „Folien + Kamera“ (1920 × 1080)', font=fs, fill=(90, 100, 110))
    else:
        d.rectangle([0, 0, W - 1, H - 1], outline=TEAL, width=3)
        d.rectangle([0, 0, int(1440 * s), H], fill=(255, 255, 255)); d.rectangle([0, 0, int(1440 * s), 26], fill=TEAL)
        d.text((20, 230), 'Browser-Fenster 1440 × 1080', font=fb, fill=DARK); d.text((20, 265), 'AutomatenLab, Zoom 100–125 %, Großansicht', font=fs, fill=DARK)
        d.rectangle([int(1440 * s), 0, W, H], fill=DARK)
        d.text((int(1470 * s), 30), 'Titel + QR', font=fs, fill=SAND); d.rectangle([int(1535 * s), 140, int(1825 * s), 285], fill=WHITE)
        x0, y0, x1, y1 = [int(c * s) for c in CAM]
        d.rectangle([x0, y0, x1, y1], fill=(248, 236, 219)); corners(d, x0, y0, x1, y1, OCK, 14, 3); d.text((x0 + 60, y0 + 45), 'Kamera', font=fb, fill=OCK)
        d.text((10, H - 30), 'Szene B „AutomatenLab + Seitenleiste“', font=fs, fill=(90, 100, 110))
    im.save(OUT + f'Skizzen/szene_{kind}.png')
sketch('A'); sketch('B')

# ---------------------------------------------------------------- 3) Thumbnails 1280 x 720
for v in META:
    im = Image.new('RGB', (1280, 720), TEAL); d = ImageDraw.Draw(im)
    d.rectangle([0, 620, 1280, 720], fill=DARK)
    d.rounded_rectangle([60, 55, 60 + d.textlength(label(v).upper(), font=f('Carlito-Bold.ttf', 34)) + 40, 115], radius=14, fill=OCK)
    d.text((80, 62), label(v).upper(), font=f('Carlito-Bold.ttf', 34), fill=WHITE)
    t = v['title'].split(':')[0] if ':' in v['title'] else v['title']
    sub = v['title'].split(':', 1)[1].strip() if ':' in v['title'] else ''
    y = 160
    for ln in wrap(d, t, f('Caladea-Bold.ttf', 92), 800):
        d.text((60, y), ln, font=f('Caladea-Bold.ttf', 92), fill=WHITE); y += 104
    if sub:
        y += 10
        for ln in wrap(d, sub, f('Caladea-Italic.ttf', 46), 800):
            d.text((60, y), ln, font=f('Caladea-Italic.ttf', 46), fill=SAND); y += 56
    d.text((60, 648), 'Maschinen, die Sprache verstehen  ·  Informatik Abitur', font=f('Carlito-Regular.ttf', 34), fill=(215, 234, 230))
    # Automaten-Motiv rechts
    pts = [(960, 200), (1150, 200), (1055, 400)]
    d.line([(1020, 200), (1090, 200)], fill=(215, 234, 230), width=6); d.line([(1130, 255), (1085, 345)], fill=(215, 234, 230), width=6)
    for i, (x, y0) in enumerate(pts):
        d.ellipse([x - 60, y0 - 60, x + 60, y0 + 60], fill=TEAL, outline=SAND if i == 2 else (215, 234, 230), width=7)
        if i == 2: d.ellipse([x - 47, y0 - 47, x + 47, y0 + 47], outline=SAND, width=4)
        d.text((x, y0), f'S{i}', font=f('Caladea-Bold.ttf', 50), fill=WHITE, anchor='mm')
    if 'eA' in v['kurs'] and 'gA' not in v['kurs']:
        d.text((1215, 560), 'eA', font=f('Carlito-Bold.ttf', 40), fill=SAND, anchor='rm')
    im.save(OUT + f"Thumbnails/{v['file']}_Thumbnail.png")
print('ok')
