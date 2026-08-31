#!/usr/bin/env python3
"""Behebt die Befunde des axe-core-Prüflaufs (WCAG 2.1 AA) im Abzug.

Drei Befunde, alle aus dem Lauf vom 31.08.2026 über 16 Seiten:

1. link-name: Die Icon-Links im Menü (Warenkorb, teils Suche) haben
   keinen zugänglichen Namen – Avada blendet den Menütext im
   «nur Icon»-Modus mit display:none aus, womit er auch für
   Screenreader verschwindet. Fix: aria-label am Link.
2. frame-title: Die Google-Maps-Karte auf /kontakt/ hat keinen
   Titel. Fix: title-Attribut am iframe.
3. link-in-text-block: Der Datenschutz-Link im Cookie-Balken ist nur
   an der Farbe erkennbar. Fix: Unterstreichung per CSS im
   Child-Theme (lädt auf jeder Seite).

Aufruf: python3 barrierefrei.py <statisch-verzeichnis>
"""
import re
import sys
from pathlib import Path

WURZEL = Path(sys.argv[1])

ICON_NAMEN = [
    ('fa-shopping-cart', 'Warenkorb'),
    ('fa-search', 'Suche'),
    ('fa-instagram', 'Instagram'),
]

anker = iframes = 0
for datei in sorted(WURZEL.rglob('*.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    alt = src

    def benennen(m: re.Match) -> str:
        global anker
        tag, innen = m.group(1), m.group(2)
        if 'aria-label' in tag or 'title=' in tag:
            return m.group(0)
        for icon, name in ICON_NAMEN:
            if icon in innen:
                anker += 1
                return tag[:-1] + f' aria-label="{name}">' + innen
        return m.group(0)

    src = re.sub(r'(<a\s[^>]*icon-only[^>]*>)((?:(?!</a>)[\s\S]){0,600})',
                 benennen, src)

    def kachel(m: re.Match) -> str:
        """Produktkacheln im Shop: Der Link liegt als Überlagerung auf
        dem Bild und hat keinen Text – der Produktname steht erst in
        der Überschrift danach. Den Namen als aria-label übernehmen."""
        global anker
        tag = m.group(0)
        if 'aria-label' in tag:
            return tag
        folge = src[m.end():m.end() + 2500]
        titel = re.search(r'<h[1-6][^>]*>\s*([^<]{3,120}?)\s*<', folge)
        if not titel:
            return tag
        anker += 1
        name = titel.group(1).replace('"', '&quot;')
        return tag[:-1] + f' aria-label="{name}">'

    src = re.sub(r'<a class="fusion-column-anchor[^"]*"[^>]*>', kachel, src)

    def karte(m: re.Match) -> str:
        global iframes
        tag = m.group(0)
        if 'title=' in tag:
            return tag
        iframes += 1
        return tag[:-1] + ' title="Google-Maps-Karte: Standort SONNENBERG, Landhausstrasse, Baar">'

    src = re.sub(r'<iframe[^>]*google\.com/maps[^>]*>', karte, src)

    if src != alt:
        datei.write_text(src, encoding='utf-8')

print(f'{anker} Icon-Links benannt, {iframes} Karten-iframes betitelt.')

css = WURZEL / 'wp-content/themes/Avada-Child-Theme/style.css@ver=7.1.css'
MARKER = '/* Barrierefreiheit: */'
inhalt = css.read_text(encoding='utf-8', errors='replace')
if MARKER not in inhalt:
    inhalt += (
        f'\n{MARKER}\n'
        '/* Der Datenschutz-Link im Cookie-Balken war nur an der Farbe\n'
        '   erkennbar (WCAG 1.4.1). */\n'
        '.fusion-privacy-bar-main a { text-decoration: underline; }\n')
    css.write_text(inhalt, encoding='utf-8')
    print('CSS-Ergänzung für den Cookie-Balken geschrieben.')
else:
    print('CSS-Ergänzung war schon da.')
