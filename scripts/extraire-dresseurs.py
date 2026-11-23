"""Découpe les dresseurs anonymes de la planche HG/SS (collectée par Dann-The-Yoshi).

Usage : python3 scripts/extraire-dresseurs.py scripts/sources/dresseurs-hgss.png public/dresseurs
On ne garde que des dresseurs sans nom (pas les héros, les rivaux, les champions ni la Team Rocket).
Sorties : un PNG détouré par dresseur, et src/app/core/dresseurs.ts.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# clé : (nom affiché, (haut, gauche, bas, droite) sur la planche)
DRESSEURS = {
    'jeune-pousse': ('Jeune pousse', (21, 181, 81, 218)),
    'fillette': ('Fillette', (11, 253, 80, 301)),
    'campeur': ('Campeur', (85, 584, 160, 616)),
    'cow-girl': ('Cow-girl', (92, 499, 160, 542)),
    'topdresseur': ('Topdresseur', (162, 20, 240, 61)),
    'topdresseuse': ('Topdresseuse', (164, 97, 241, 143)),
    'aventurier': ('Aventurier', (243, 264, 320, 298)),
    'aventuriere': ('Aventurière', (248, 340, 320, 381)),
    'karateka': ('Karatéka', (81, 174, 160, 226)),
    'acrobate': ('Acrobate', (9, 816, 80, 865)),
    'detective': ('Détective', (323, 255, 400, 305)),
    'archeologue': ('Archéologue', (344, 12, 399, 66)),
    'montagnard': ('Montagnard', (3, 733, 81, 786)),
    'chasseur-insectes': ('Chasseur d’insectes', (8, 491, 81, 547)),
    'moine': ('Moine', (480, 573, 561, 630)),
    'ouvrier': ('Ouvrier', (345, 894, 400, 947)),
    'cracheur-feu': ('Cracheur de feu', (406, 319, 480, 401)),
    'nageuse': ('Nageuse', (243, 585, 321, 619)),
    'jardiniere': ('Jardinière', (106, 734, 160, 786)),
    'rockeur': ('Rockeur', (324, 336, 400, 385)),
    'medium': ('Médium', (328, 94, 400, 145)),
    'skieuse': ('Skieuse', (328, 643, 401, 720)),
    'motard': ('Motard', (399, 403, 480, 480)),
    'dame': ('Dame', (9, 578, 80, 621)),
    'marin': ('Marin', (245, 819, 320, 860)),
}


def detourer(planche, zone):
    y0, x0, y1, x1 = zone
    crop = planche.crop((x0, y0, x1, y1))
    a = np.array(crop)[:, :, 3] > 0
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=1))
    if n > 1:
        aires = ndimage.sum(a, lab, range(1, n + 1))
        garder = [i + 1 for i, s in enumerate(aires) if s >= 0.08 * aires.max()]
        masque = np.isin(lab, garder) & a
        px = np.array(crop)
        px[~masque] = 0
        crop = Image.fromarray(px)
    return crop.crop(crop.getbbox())


def main(source, sortie):
    planche = Image.open(source).convert('RGBA')
    out = Path(sortie)
    out.mkdir(parents=True, exist_ok=True)
    infos = {}
    for cle, (nom, zone) in DRESSEURS.items():
        img = detourer(planche, zone)
        img.save(out / f'{cle}.png', optimize=True)
        infos[cle] = {'nom': nom, 'w': img.width, 'h': img.height}
    lignes = ',\n'.join(f"  '{k}': {{ nom: {json.dumps(v['nom'], ensure_ascii=False)}, w: {v['w']}, h: {v['h']} }}" for k, v in infos.items())
    Path('src/app/core/dresseurs.ts').write_text(
        "// Généré par scripts/extraire-dresseurs.py. Ne pas modifier à la main.\n"
        "// Sprites de Pokémon Or HeartGold et Argent SoulSilver, planche rassemblée par Dann-The-Yoshi.\n"
        "export interface Dresseur {\n  nom: string;\n  w: number;\n  h: number;\n}\n\n"
        f"export const DRESSEURS: Record<string, Dresseur> = {{\n{lignes},\n}};\n\n"
        "export const dresseurImg = (cle: string) => `dresseurs/${cle}.png`;\n",
        encoding='utf-8',
    )
    print(len(infos), 'dresseurs')


if __name__ == '__main__':
    main(*sys.argv[1:3])
