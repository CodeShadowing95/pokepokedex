"""
Découpe les effets d'attaque de la planche de JoshR_691 (scripts/sources/attaques-joshr691.png)
en bandes d'images, une par effet, et écrit leur description pour l'application.

    python3 scripts/extraire-effets.py scripts/sources/attaques-joshr691.png public/effets

Dépendances : Pillow, numpy, scipy. Planche : « 100% Custom Pokemon Attack Sheet made by JoshR_691 »,
utilisée avec crédit (page Crédits).
"""
import json, sys
from PIL import Image
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
a = np.array(Image.open(SRC).convert('RGBA'))
d = np.abs(a[:, :, :3].astype(int) - [199, 225, 209]).sum(2)
a[d <= 30, 3] = 0
alpha = a[:, :, 3] > 0

# nom: (x0, y0, x1, y1) — zone grossière ; les images sont séparées par les colonnes vides.
ZONES = {
    'normal':   (44, 672, 102, 726),
    'combat':   (266, 364, 284, 383),
    'vol':      (250, 294, 302, 348),
    'poison':   (222, 20, 250, 50),
    'sol':      (190, 229, 260, 244),
    'roche':    (104, 376, 176, 392, 5),
    'insecte':  (236, 186, 262, 214),
    'spectre':  (0, 114, 101, 140, 4),
    'acier':    (284, 364, 302, 383),
    'feu':      (188, 383, 262, 411),
    'eau':      (250, 408, 304, 430),
    'plante':   (0, 436, 244, 481),
    'electrik': (0, 346, 24, 426),
    'psy':      (160, 99, 234, 115),
    'glace':    (30, 326, 50, 347),
    'dragon':   (72, 292, 90, 325),
    'tenebres': (104, 394, 172, 410, 4),
    'fee':      (254, 99, 268, 114),
    'impact':   (0, 482, 98, 506),
    'garde':    (0, 507, 280, 578),
}

def nettoyer(x0, y0, x1, y1):
    """Retire les bouts de dessins voisins qui touchent le bord de la zone."""
    from scipy import ndimage
    sub = alpha[y0:y1, x0:x1].copy()
    lab, n = ndimage.label(sub, structure=np.ones((3, 3)))
    total = sub.sum()
    for i in range(1, n + 1):
        m = lab == i
        bord = m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()
        if bord and m.sum() < 0.08 * total:
            sub[m] = False
    return sub

def frames(x0, y0, x1, y1, gap=1):
    sub = nettoyer(x0, y0, x1, y1)
    cols = sub.any(0)
    spans, start, empty = [], None, 0
    for x, c in enumerate(cols):
        if c:
            if start is None: start = x
            empty = 0; end = x
        elif start is not None:
            empty += 1
            if empty >= gap: spans.append((start, end + 1)); start = None
    if start is not None: spans.append((start, end + 1))
    fus = []
    for sp in spans:
        if fus and fus[-1][1] - fus[-1][0] < 5: fus[-1] = (fus[-1][0], sp[1])
        else: fus.append(sp)
    spans = fus
    out = []
    for s, e in spans:
        rows = sub[:, s:e].any(1); ys = np.where(rows)[0]
        if (sub[:, s:e]).sum() < 6: continue
        out.append((x0 + s, y0 + ys[0], x0 + e, y0 + ys[-1] + 1))
    return out

manifest = {}
def egales(x0, y0, x1, y1, n):
    pas = (x1 - x0) / n
    out = []
    for i in range(n):
        a0, a1 = int(x0 + i * pas), int(x0 + (i + 1) * pas)
        sub = nettoyer(x0, y0, x1, y1)[:, a0 - x0:a1 - x0]
        ys, xs = np.where(sub)
        out.append((a0 + xs.min(), y0 + ys.min(), a0 + xs.max() + 1, y0 + ys.max() + 1))
    return out

for nom, z in ZONES.items():
    fr = egales(*z) if len(z) == 5 else frames(*z)
    w = max(b[2] - b[0] for b in fr); h = max(b[3] - b[1] for b in fr)
    strip = Image.new('RGBA', (w * len(fr), h))
    z0 = z[:4]; propre = nettoyer(*z0)
    for i, (x0, y0, x1, y1) in enumerate(fr):
        px = a[y0:y1, x0:x1].copy()
        px[~propre[y0 - z0[1]:y1 - z0[1], x0 - z0[0]:x1 - z0[0]], 3] = 0
        img = Image.fromarray(px)
        strip.paste(img, (i * w + (w - (x1 - x0)) // 2, h - (y1 - y0)))
    strip.save(f'{OUT}/{nom}.png', optimize=True)
    manifest[nom] = {'frames': len(fr), 'w': int(w), 'h': int(h)}
    print(nom, len(fr), w, h)
lignes = [f"  {nom}: {{ frames: {v['frames']}, w: {v['w']}, h: {v['h']} }}," for nom, v in manifest.items()]
ts = ('// Généré par scripts/extraire-effets.py : ne pas modifier à la main.\n'
      'export interface Effet { frames: number; w: number; h: number }\n\n'
      'export const EFFETS: Record<string, Effet> = {\n' + '\n'.join(lignes) + '\n};\n')
open('src/app/core/game/effets.ts', 'w').write(ts)
