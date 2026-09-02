#!/usr/bin/env python3
"""Macht die Team-Kacheln der Organisations-Seite redaktionell pflegbar.

Liest die Personen-Kacheln der gespiegelten Seite
(ueber-uns/organisation) aus – Gruppe, Name, Funktion, Porträt,
Mailadresse – und schreibt sie als einzelne Dateien nach quelle/team/.
Zusätzlich entsteht die Vorlage quelle/organisation.njk: dieselbe
Seite, aber mit Schleifen über die Team-Sammlung statt fest
verdrahteter Kacheln.

Gelernt und eingebaut:
- Gruppen-Überschriften können verschachtelt sein
  (<h2><p>Stabstellen</p></h2>) – die Regex toleriert Zwischen-Tags.
- Die Kachel wird NICHT vereinfacht, sondern als Original übernommen
  und nur inhaltlich parametrisiert – die Inline-Styles der Spalten
  und Knöpfe tragen das ganze Erscheinungsbild.

Aufruf: python3 team-extrahieren.py <statisch> <quelle>
"""
import html
import json
import re
import sys
from pathlib import Path

STATISCH = Path(sys.argv[1])
QUELLE = Path(sys.argv[2])

src = (STATISCH / 'ueber-uns/organisation/index.html').read_text(encoding='utf-8')

KARTE = re.compile(r'<li class="[^"]*fusion-post-cards-grid-column[^"]*"[\s\S]*?</li>')
GRUPPE = re.compile(r'<h2[^>]*>(?:\s*<[^>]+>)*\s*([^<]{3,60}?)\s*(?:</[^>]+>\s*)*</h2>')
UL = re.compile(r'<ul class="fusion-grid [^"]*fusion-grid-posts-cards">[\s\S]*?</ul>')


def slug(name: str) -> str:
    s = name.lower()
    for a, b in [('ä', 'ae'), ('ö', 'oe'), ('ü', 'ue'), ('é', 'e'), ('è', 'e')]:
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def gruppe_vor(position: int) -> str:
    kandidaten = [m for m in GRUPPE.finditer(src) if m.start() < position]
    return kandidaten[-1].group(1).strip() if kandidaten else ''


# --- 1. Personen extrahieren
(QUELLE / 'team').mkdir(parents=True, exist_ok=True)
reihenfolge = 0
personen = 0
for karte in KARTE.finditer(src):
    block = karte.group(0)
    name = re.search(r'<h4[^>]*>([^<]+)</h4>', block)
    if not name:
        continue
    funktion = re.search(r'<p>([^<]+)</p>', block)
    bild = re.search(r'data-orig-src="\.\./\.\./([^"]+)"', block) \
        or re.search(r'src="\.\./\.\./((?!data:)[^"]+)"', block)
    mail = re.search(r'mailto:([^"]+)"', block)
    reihenfolge += 10
    daten = {
        'name': html.unescape(name.group(1)).strip(),
        'funktion': html.unescape(funktion.group(1)).strip() if funktion else '',
        'gruppe': gruppe_vor(karte.start()),
        'bild': '/' + bild.group(1) if bild else '',
        'email': mail.group(1) if mail else '',
        'reihenfolge': reihenfolge,
    }
    ziel = QUELLE / 'team' / f'{slug(daten["name"])}.md'
    ziel.write_text('---json\n' + json.dumps(daten, ensure_ascii=False, indent=1)
                    + '\n---\n', encoding='utf-8')
    personen += 1
print(f'{personen} Personen nach quelle/team/ extrahiert.')

# --- 2. Spender-Kachel parametrisieren (Original-Markup behalten)
spender = next(m.group(0) for m in KARTE.finditer(src)
               if '>Roman Della Rossa<' in m.group(0) and 'mailto:' in m.group(0))
kachel = re.sub(r'<img[^>]*>',
                '<img src="../..{{ person.data.bild }}" alt="Porträt von {{ person.data.name }}" '
                'class="img-responsive" loading="lazy" style="width:100%;height:auto;" />',
                spender, count=1)
kachel = kachel.replace('>Roman Della Rossa<', '>{{ person.data.name }}<')
kachel = re.sub(r'<p>Geschäftsführer</p>', '<p>{{ person.data.funktion }}</p>', kachel)
knopf = re.search(r'<div [^>]*><a class="fusion-button[\s\S]*?</a></div>', kachel).group(0)
neu_knopf = re.sub(r'mailto:[^"]+', 'mailto:{{ person.data.email }}', knopf)
neu_knopf = re.sub(r'(<span class="fusion-button-text[^"]*">)[^<]*(</span>)',
                   r'\1{{ person.data.email }}\2', neu_knopf)
kachel = kachel.replace(knopf, '{% if person.data.email %}' + neu_knopf + '{% endif %}')
kachel = re.sub(r'fusion-builder-column-\d+', 'fusion-builder-column-team', kachel)

# --- 3. Kachellisten durch Gruppen-Schleifen ersetzen
neu = src
ersetzt = 0
for ul in UL.finditer(src):
    if '<h4' not in ul.group(0):
        continue
    gruppe = gruppe_vor(ul.start())
    schleife = ('<ul class="fusion-grid fusion-grid-3 fusion-flex-align-items-stretch fusion-grid-posts-cards">'
                '{% for person in collections.team %}'
                '{% if person.data.gruppe == "' + gruppe + '" %}'
                + kachel + '{% endif %}{% endfor %}</ul>')
    neu = neu.replace(ul.group(0), schleife, 1)
    ersetzt += 1

kopf = '---json\n{"permalink": "/ueber-uns/organisation/index.html", "eleventyExcludeFromCollections": true}\n---\n'
(QUELLE / 'organisation.njk').write_text(kopf + neu, encoding='utf-8')
print(f'organisation.njk geschrieben; {ersetzt} Kachellisten zu Gruppen-Schleifen gemacht.')
