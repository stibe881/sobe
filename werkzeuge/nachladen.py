#!/usr/bin/env python3
"""Lädt Dateien nach, die der wget-Spiegel übersehen hat.

Warum nötig: Avada lädt Bilder verzögert – die responsiven Varianten
stehen in data-srcset/data-src, und wget liest nur src/srcset. Ebenso
fordern WooCommerce-Skripte weitere JS-Dateien mit ?ver=… an, die im
Spiegel unter dem Namen mit Query fehlen. Beides fiel erst beim Test im
Browser auf: ~600 Dateien gaben 404.

Aufruf: python3 nachladen.py <spiegel-verzeichnis>
"""
import html
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

WURZEL = Path(sys.argv[1])
ENDUNGEN = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.css',
            '.js', '.woff', '.woff2', '.ttf', '.mp4', '.pdf', '.ico', '.avif')
MUSTER = re.compile(r'wp-content/(?:uploads|plugins|themes)/[^"\'\s)\\?#>,]+')

refs = set()
for datei in WURZEL.rglob('*'):
    if datei.suffix.lower() not in ('.html', '.css', '.js'):
        continue
    src = datei.read_text(encoding='utf-8', errors='replace')
    for m in MUSTER.finditer(src):
        pfad = html.unescape(m.group(0)).rstrip('.,;')
        if pfad.endswith(ENDUNGEN):
            refs.add(pfad)

fehlend = sorted(p for p in refs if not (WURZEL / p).is_file())
print(f'{len(refs)} Dateien referenziert, {len(fehlend)} fehlen.')

ok = fehler = 0
for pfad in fehlend:
    ziel = WURZEL / pfad
    ziel.parent.mkdir(parents=True, exist_ok=True)
    url = 'https://www.sonnenberg-baar.ch/' + urllib.parse.quote(pfad)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            ziel.write_bytes(r.read())
        ok += 1
    except Exception as e:
        fehler += 1
        print(f'  fehlgeschlagen: {pfad} ({e})')
    time.sleep(0.05)
print(f'Nachgeladen: {ok}, fehlgeschlagen: {fehler}')
