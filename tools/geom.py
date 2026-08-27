#!/usr/bin/env python3
"""Contrôle géométrique : compare une frame de la vidéo de référence à une
capture du jeu, au pixel près.

    python3 tools/geom.py reference.png capture.png

Les deux images doivent faire 576 x 1024. Le script relève les bords sombres
de l'arène et des jauges — ce sont les repères qui ne doivent jamais bouger.
Il ignore volontairement les textes : la police de rendu dépend du poste.

Dépendances : numpy, pillow.
"""

import sys
import numpy as np
from PIL import Image

DARK = 260          # somme RVB en dessous de laquelle un pixel est « encre »


def runs(mask):
    """Segments contigus de True, en (début, fin) inclusifs."""
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            out.append((start, i - 1))
            start = None
    if start is not None:
        out.append((start, len(mask) - 1))
    return out


def probe(path):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    if a.shape[:2] != (1024, 576):
        sys.exit('%s fait %dx%d, attendu 576x1024' % (path, a.shape[1], a.shape[0]))
    d = a.sum(2) < DARK
    # Une ligne / colonne d'arène est sombre sur presque toute sa longueur.
    rowdark = d[:, 45:530].sum(1)
    coldark = d[265:755, :].sum(0)
    return {
        'fond': tuple(a[100, 100]),
        'arene_lignes': [i for i in range(1024) if rowdark[i] > 400],
        'arene_colonnes': [i for i in range(576) if coldark[i] > 400],
        'jauges_ligne777': runs(d[777]),
        'jauges_lignes': [y for y in range(770, 815) if d[y, 150]],
    }


def flat(v):
    """Aplatit une liste de bornes ou de segments en liste d'entiers."""
    out = []
    for item in v:
        out.extend(item if isinstance(item, tuple) else [item])
    return out


def compare(a, b, tol=1):
    """Vrai si les deux relevés coïncident à `tol` pixels près.

    La tolérance n'est pas du laxisme : un bord anticrénelé tombe de part et
    d'autre du seuil selon une différence de couverture de l'ordre du
    dixième de pixel. Sur la vidéo de référence, la colonne 37 est couverte
    à 0,67 sous l'arène et à 0,58 sous la jauge — même bord, deux verdicts.
    """
    fa, fb = flat(a), flat(b)
    if len(fa) != len(fb):
        return False
    return all(abs(x - y) <= tol for x, y in zip(fa, fb))


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    ref, got = probe(sys.argv[1]), probe(sys.argv[2])

    ok = True
    for key in ref:
        if key == 'fond':
            same = all(abs(int(x) - int(y)) <= 2 for x, y in zip(ref[key], got[key]))
        else:
            same = compare(ref[key], got[key])
        ok &= same
        exact = ref[key] == got[key]
        print('%-16s %s' % (key, 'OK' if exact else ('OK (±1px)' if same else 'ECART')))
        if not exact:
            print('   référence : %s' % (ref[key],))
            print('   capture   : %s' % (got[key],))
    print('\n%s' % ('géométrie conforme' if ok else 'géométrie divergente'))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
