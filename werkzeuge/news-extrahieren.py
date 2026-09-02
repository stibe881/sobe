#!/usr/bin/env python3
"""Zerlegt die gespiegelten News-Seiten in Vorlage und Inhalte.

Aus einer Spenderseite entsteht die Eleventy-Vorlage
(quelle/_includes/news-rahmen.njk): Kopf, Menü, Titelleiste und
Fusszeile des Sonnenberg-Designs, mit Platzhaltern für Titel und
Beitragsinhalt. Aus jeder News-Seite entsteht eine Inhaltsdatei
(quelle/news/<slug>.html) mit JSON-Frontmatter und dem unveränderten
Beitrags-HTML – so bleiben die 72 Alt-Beiträge pixelgleich, während
neue Beiträge als Markdown durch dieselbe Vorlage laufen.

JSON-Frontmatter statt YAML, weil Titel Anführungszeichen und
Doppelpunkte enthalten («Kinderbuch "Beno und Flecki"»).

Aufruf: python3 news-extrahieren.py <statisch> <quelle>
"""
import html
import json
import re
import sys
from pathlib import Path

STATISCH = Path(sys.argv[1])
QUELLE = Path(sys.argv[2])
SPENDER = 'skilager-in-arosa'

ENDE = re.compile(r'</div>\s*</div>\s*</section>')


def zerlegen(src: str):
    """(rein, testbar) Liefert (vorher, inhalt, nachher) einer
    News-Seite: inhalt ist das rohe HTML innerhalb von
    <div class="post-content">."""
    start = src.index('<div class="post-content">') + len('<div class="post-content">')
    m = ENDE.search(src, start)
    return src[:start], src[start:m.start()], src[m.start():]


def felder(src: str, slug: str) -> dict:
    titel = re.search(r'<title>(.*?)\s*-\s*SONNENBERG', src, re.S)
    datum = re.search(r'"datePublished":"([^"]+)"', src)
    post = re.search(r'<div id="post-(\d+)" class="post-\d+ post type-post[^"]*?category-([a-z-]+)', src)
    return {
        'layout': 'news-rahmen.njk',
        'titel': html.unescape(titel.group(1)).strip() if titel else slug,
        'datum': datum.group(1)[:10] if datum else '2000-01-01',
        'kategorie': post.group(2) if post else 'aktuelles',
        'beitragId': post.group(1) if post else '0',
        'permalink': f'/{slug}/index.html',
    }


# --- 1. Vorlage aus der Spenderseite
spender_src = (STATISCH / SPENDER / 'index.html').read_text(encoding='utf-8')
vorher, _, nachher = zerlegen(spender_src)
f = felder(spender_src, SPENDER)

rahmen = vorher + '\n{{ content | safe }}\n' + nachher
# Titel überall parametrisieren: <title>, Titelleiste (h1), Brotkrumen.
rahmen = re.sub(r'<title>.*?</title>',
                '<title>{{ titel }} - SONNENBERG Kompetenzzentrum Sehen Verhalten Sprechen</title>',
                rahmen, count=1, flags=re.S)
titel_escaped = re.escape(html.escape(f['titel'], quote=False))
rahmen = re.sub(titel_escaped, '{{ titel }}', rahmen)
rahmen = re.sub(re.escape(f['titel']), '{{ titel }}', rahmen)
# Beitrags-Kennung
rahmen = rahmen.replace(f'id="post-{f["beitragId"]}"', 'id="post-{{ beitragId }}"')
rahmen = rahmen.replace(f'post-{f["beitragId"]} post', 'post-{{ beitragId }} post')
rahmen = rahmen.replace(f'postid-{f["beitragId"]}', 'postid-{{ beitragId }}')
rahmen = rahmen.replace(f'category-{f["kategorie"]}', 'category-{{ kategorie }}')
# WordPress-API-Reste (oEmbed, Kommentar-Feed, Shortlink, EditURI)
# zeigen ins Leere und trügen sonst die Beitragsnummer der
# Spenderseite auf jeder News.
rahmen = re.sub(r'<link rel="alternate" type="application/rss\+xml" title="[^"]*Kommentar-Feed[^"]*"[^>]*/>\s*', '', rahmen)
rahmen = re.sub(r'<link rel="alternate" title="oEmbed[^"]*"[^>]*/>\s*', '', rahmen)
rahmen = re.sub(r'<link rel="https://api\.w\.org/"[^>]*/>', '', rahmen)
rahmen = re.sub(r'<link rel="alternate" title="JSON" type="application/json"[^>]*/>', '', rahmen)
rahmen = re.sub(r'<link rel="EditURI"[^>]*/>', '', rahmen)
rahmen = re.sub(r"<link rel='shortlink'[^>]*/>\s*", '', rahmen)
# Seitenspezifische Suchmaschinen-Metadaten der Spenderseite entfernen –
# sie beschrieben das Skilager und wären auf jeder News falsch.
rahmen = re.sub(r'<script type="application/ld\+json"[^>]*>[\s\S]*?</script>', '', rahmen)
rahmen = re.sub(r'<meta (?:name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*', '', rahmen)
rahmen = re.sub(r'<link rel="canonical"[^>]*>\s*', '', rahmen)

ziel = QUELLE / '_includes' / 'news-rahmen.njk'
ziel.parent.mkdir(parents=True, exist_ok=True)
ziel.write_text(rahmen, encoding='utf-8')
uebrig = len(re.findall(re.escape(f['titel'].split()[-1]), rahmen))
print(f'Vorlage geschrieben ({len(rahmen)} Zeichen); Rest-Treffer Spendertitel: {uebrig}')

# --- 2. Alle Beiträge extrahieren
(QUELLE / 'news').mkdir(parents=True, exist_ok=True)
anzahl = 0
for datei in sorted(STATISCH.glob('*/index.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    if not re.search(r'<div id="post-\d+" class="post-\d+ post type-post', src):
        continue
    slug = datei.parent.name
    try:
        _, inhalt, _ = zerlegen(src)
    except ValueError:
        print('  ÜBERSPRUNGEN (kein post-content):', slug)
        continue
    meta = felder(src, slug)
    aus = '---json\n' + json.dumps(meta, ensure_ascii=False, indent=1) + '\n---\n' + inhalt
    (QUELLE / 'news' / f'{slug}.html').write_text(aus, encoding='utf-8')
    anzahl += 1
print(f'{anzahl} Beiträge nach quelle/news/ extrahiert.')
