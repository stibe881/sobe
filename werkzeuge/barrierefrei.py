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

    # Der Skip-Link («Zum Inhalt springen») zeigte nach der Spiegelung
    # auf Dateien – teils sogar auf andere Seiten –, weil wget den
    # ursprünglichen Selbstverweis (/?p=NNN#content) in einen Dateilink
    # umgeschrieben hat. Er muss schlicht zum Anker der aktuellen
    # Seite springen (WCAG 2.4.1).
    src, n = re.subn(r'(class="skip-link[^"]*"\s+href=")[^"#]*#content"',
                     r'\1#content"', src)
    anker += n

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

# --- Erklärung zur Barrierefreiheit: Seite einsetzen und in der
# Fusszeile neben Impressum/Datenschutz verlinken. Die Seite existiert
# im WordPress nicht; sie liegt als Vorlage neben diesem Skript, damit
# sie einen frischen Abzug überlebt.
for vorlage_name, ziel_pfad in [
    ('barrierefreiheit-seite.html', 'barrierefreiheit/index.html'),
    ('404-seite.html', '404.html'),
]:
    vorlage = Path(__file__).with_name(vorlage_name)
    seite = WURZEL / ziel_pfad
    if vorlage.is_file() and not seite.is_file():
        seite.parent.mkdir(exist_ok=True)
        seite.write_text(vorlage.read_text(encoding='utf-8'), encoding='utf-8')
        print(f'{ziel_pfad} eingesetzt.')

fusszeilen = 0
FUSS = re.compile(
    r'(>Impressum</a> \| <a href="([^"]*?)(?:datenschutzerklaerung|datenschutz)'
    r'(?:\.html|/index\.html|/)?">Datenschutzerklärung</a>)')
for datei in sorted(WURZEL.rglob('*.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    if 'barrierefreiheit/index.html">Barrierefreiheit' in src:
        continue

    def fuss(m: re.Match) -> str:
        global fusszeilen
        fusszeilen += 1
        return (m.group(1) + ' | <a href="' + m.group(2)
                + 'barrierefreiheit/index.html">Barrierefreiheit</a>')

    neu = FUSS.sub(fuss, src, count=1)
    if neu != src:
        datei.write_text(neu, encoding='utf-8')
print(f'{fusszeilen} Fusszeilen um den Barrierefreiheit-Link ergänzt.')

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
