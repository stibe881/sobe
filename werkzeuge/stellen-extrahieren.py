#!/usr/bin/env python3
"""Macht die Stelleninserate redaktionell pflegbar.

Wie bei den News: Die 8 Inserat-Seiten (job/…) werden in Vorlage und
Inhalte zerlegt – quelle/stellen/<slug>.html trägt Titel,
Bewerbungslink und Reihenfolge im Frontmatter, der Beschrieb bleibt
als unverändertes HTML. Die Übersicht «Offene Stellen» auf /jobs/
wird zur Schleife über die Sammlung: neue Inserate erscheinen dort
von selbst, gelöschte verschwinden.

Neue Inserate aus dem Redaktionssystem sind Markdown; die Vorlage
hängt ihnen den «Jetzt bewerben»-Knopf an, sobald ein
Bewerbungslink gesetzt ist (Alt-Inserate haben ihn schon im Text).

Aufruf: python3 stellen-extrahieren.py <statisch> <quelle>
"""
import html
import json
import re
import sys
from pathlib import Path

STATISCH = Path(sys.argv[1])
QUELLE = Path(sys.argv[2])
ENDE = re.compile(r'</div>\s*</div>\s*</section>')


def zerlegen(src: str):
    start = src.index('<div class="post-content">') + len('<div class="post-content">')
    m = ENDE.search(src, start)
    return src[:start], src[start:m.start()], src[m.start():]


# --- 1. Inserate extrahieren, Reihenfolge wie auf der Jobs-Seite
jobs_src = (STATISCH / 'jobs/index.html').read_text(encoding='utf-8')
# Kacheln verlinken über ?p=-Shortlinks; Beitragsnummer → Slug auflösen
shortlinks = re.findall(r'href="\.\./index\.html@p=(\d+)\.html"', jobs_src)
nummer_zu_slug = {}
for datei in sorted((STATISCH / 'job').glob('*/index.html')):
    s = datei.read_text(encoding='utf-8', errors='replace')
    m = re.search(r'<div id="post-(\d+)" class="[^"]*type-job', s)
    if m:
        nummer_zu_slug[m.group(1)] = datei.parent.name
reihenfolge_map = {}
for i, nr in enumerate(dict.fromkeys(shortlinks)):
    if nr in nummer_zu_slug:
        reihenfolge_map[nummer_zu_slug[nr]] = (i + 1) * 10

(QUELLE / 'stellen').mkdir(parents=True, exist_ok=True)
spender_slug = None
anzahl = 0
for datei in sorted((STATISCH / 'job').glob('*/index.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    slug = datei.parent.name
    if not re.search(r'<div id="post-\d+" class="[^"]*type-job', src):
        continue
    vorher, inhalt, _ = zerlegen(src)
    titel = re.search(r'<title>(.*?)\s*-\s*SONNENBERG', src, re.S)
    link = re.search(r'href="(https://recruitingapp[^"]+)"', src)
    post = re.search(r'<div id="post-(\d+)"', src)
    meta = {
        'layout': 'stellen-rahmen.njk',
        'titel': html.unescape(titel.group(1)).strip() if titel else slug,
        'bewerbungslink': link.group(1) if link else '',
        'beitragId': post.group(1) if post else '0',
        'reihenfolge': reihenfolge_map.get(slug, 999),
        'permalink': f'/job/{slug}/index.html',
        'knopfImText': True,
    }
    (QUELLE / 'stellen' / f'{slug}.html').write_text(
        '---json\n' + json.dumps(meta, ensure_ascii=False, indent=1) + '\n---\n' + inhalt,
        encoding='utf-8')
    if spender_slug is None:
        spender_slug = slug
        spender_meta, spender_src = meta, src
    anzahl += 1
print(f'{anzahl} Inserate nach quelle/stellen/ extrahiert.')

# --- 2. Vorlage aus der Spenderseite
vorher, _, nachher = zerlegen(spender_src)
rahmen = vorher + '\n{{ content | safe }}\n' \
    + '{% if bewerbungslink and not knopfImText %}<div style="max-width:1064px;margin:0 auto;padding:0 30px 50px;">' \
      '<a class="fusion-button fusion-button-default-size button-default fusion-button-default-span ' \
      'fusion-button-default-type" href="{{ bewerbungslink }}" target="_blank" rel="noopener">' \
      '<span class="fusion-button-text">Jetzt bewerben</span></a></div>{% endif %}\n' \
    + nachher
rahmen = re.sub(r'<title>.*?</title>',
                '<title>{{ titel }} - SONNENBERG Kompetenzzentrum Sehen Verhalten Sprechen</title>',
                rahmen, count=1, flags=re.S)
for form in (html.escape(spender_meta['titel'], quote=False), spender_meta['titel']):
    rahmen = rahmen.replace(form, '{{ titel }}')
rahmen = rahmen.replace(f'id="post-{spender_meta["beitragId"]}"', 'id="post-{{ beitragId }}"')
rahmen = rahmen.replace(f'post-{spender_meta["beitragId"]} job', 'post-{{ beitragId }} job')
rahmen = rahmen.replace(f'postid-{spender_meta["beitragId"]}', 'postid-{{ beitragId }}')
rahmen = re.sub(r'<script type="application/ld\+json"[^>]*>[\s\S]*?</script>', '', rahmen)
rahmen = re.sub(r'<meta (?:name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*', '', rahmen)
rahmen = re.sub(r'<link rel="canonical"[^>]*>\s*', '', rahmen)
rahmen = re.sub(r'<link rel="alternate"[^>]*/>\s*', '', rahmen)
rahmen = re.sub(r"<link rel='shortlink'[^>]*/>\s*", '', rahmen)
rahmen = re.sub(r'<link rel="(?:https://api\.w\.org/|EditURI)"[^>]*/>', '', rahmen)
(QUELLE / '_includes' / 'stellen-rahmen.njk').write_text(rahmen, encoding='utf-8')
rest = rahmen.count(spender_meta['titel'].split()[0])
print(f'stellen-rahmen.njk geschrieben (Rest-Treffer Spendertitel-Wort: {rest}).')

# --- 3. Jobs-Übersicht: Kachelliste zur Schleife
UL = re.compile(r'<ul class="fusion-grid [^"]*fusion-grid-posts-cards">[\s\S]*?</ul>')
treffer = [u for u in UL.finditer(jobs_src) if 'Jetzt bewerben' in u.group(0)]
assert len(treffer) == 1, f'{len(treffer)} Stellen-Listen gefunden'
liste = treffer[0].group(0)
kachel = re.search(r'<li class="[^"]*fusion-post-cards-grid-column[\s\S]*?</li>', liste).group(0)
kachel = re.sub(r'(<h3[^>]*>)[\s\S]*?(</h3>)', r'\1{{ stelle.data.titel }}\2', kachel, count=1)
kachel = re.sub(r'href="[^"]*"', 'href="../job/{{ stelle.fileSlug }}/index.html"', kachel, count=1)
kachel = re.sub(r'fusion-builder-column-\d+', 'fusion-builder-column-stelle', kachel)
schleife = ('<ul class="fusion-grid fusion-grid-3 fusion-flex-align-items-stretch fusion-grid-posts-cards">'
            '{% for stelle in collections.stellen %}' + kachel + '{% endfor %}</ul>')
neu = jobs_src.replace(liste, schleife, 1)
kopf = '---json\n{"permalink": "/jobs/index.html", "eleventyExcludeFromCollections": true}\n---\n'
(QUELLE / 'jobs.njk').write_text(kopf + neu, encoding='utf-8')
print('jobs.njk geschrieben.')
