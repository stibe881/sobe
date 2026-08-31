#!/usr/bin/env python3
"""Bereitet den wget-Spiegel als eigenständige statische Webseite auf.

Drei Schritte, jeder aus einem konkreten Befund beim Testen:

1. wp-emoji-Lader entfernen – er holt Skripte und Bilder von s.w.org
   nach; die Seite braucht ihn nicht.
2. Verbliebene absolute Links auf die eigene Domain relativieren, damit
   ein Test unter anderer Adresse nicht auf den alten WordPress-Server
   zurückzeigt. Das escapte JSON-LD von Yoast bleibt bewusst stehen:
   Die Domain bleibt dieselbe, Suchmaschinen brauchen absolute URLs.
3. Seiten, die wget flach ablegte (shop.html), zusätzlich als
   ordner/index.html anlegen – Webserver lösen /shop/ nicht zu
   shop.html auf, und die URL soll erhalten bleiben. Dabei alle
   relativen Verweise (auch die Folgeeinträge in srcset-Listen) eine
   Ebene tiefer setzen.

Aufruf: python3 nachbearbeiten.py <spiegel-verzeichnis>
"""
import re
import sys
from pathlib import Path

WURZEL = Path(sys.argv[1])
DOMAIN = re.compile(r'(?:https?:)?//(?:www\.)?sonnenberg-baar\.ch')

geändert = 0
for datei in sorted(WURZEL.rglob('*.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    alt = src

    tiefe = len(datei.relative_to(WURZEL).parts) - 1
    praefix = '../' * tiefe if tiefe else './'

    # Vor der Zuweisung an window._wpemojiSettings steht ein
    # «auto-generated»-Kommentar – deshalb auf den Namen irgendwo im
    # Skript prüfen, nicht auf den Anfang.
    src = re.sub(
        r'<script[^>]*>(?:(?!</script>)[\s\S])*?_wpemojiSettings[\s\S]*?</script>',
        '', src)
    src = re.sub(
        r'<link[^>]*rel=.dns-prefetch.[^>]*s\.w\.org[^>]*/?>\s*', '', src)

    src = DOMAIN.sub(praefix.rstrip('/') or '.', src)

    if src != alt:
        datei.write_text(src, encoding='utf-8')
        geändert += 1
print(f'{geändert} HTML-Dateien nachbearbeitet.')


def eine_ebene_tiefer(src: str) -> str:
    """(rein, testbar) Setzt alle relativen Verweise einer flach
    gespeicherten Seite um eine Ordner-Ebene tiefer."""
    src = re.sub(
        r'((?:href|src|srcset|content|action|data-src|data-srcset)=["\'])'
        r'(\.\./|(?!\.\./|https?:|//|#|mailto:|tel:|data:))',
        lambda m: m.group(1) + '../' + (m.group(2) or ''), src)

    def srcset_fix(m):
        teile = []
        for eintrag in m.group(2).split(','):
            eintrag = eintrag.strip()
            if eintrag.startswith('./'):
                eintrag = '../' + eintrag[2:]
            teile.append(eintrag)
        return m.group(1) + ', '.join(teile) + '"'
    src = re.sub(r'((?:data-)?srcset=")([^"]*)"', srcset_fix, src)
    src = re.sub(r'url\((["\']?)\./', r'url(\1../', src)
    return src


erzeugt = 0
for flach in sorted(WURZEL.rglob('*.html')):
    if flach.name == 'index.html' or '@' in flach.name:
        continue
    ordner_datei = flach.with_suffix('') / 'index.html'
    if ordner_datei.is_file():
        continue
    ordner_datei.parent.mkdir(parents=True, exist_ok=True)
    ordner_datei.write_text(
        eine_ebene_tiefer(flach.read_text(encoding='utf-8', errors='replace')),
        encoding='utf-8')
    erzeugt += 1
print(f'{erzeugt} Ordner-Kopien angelegt.')
