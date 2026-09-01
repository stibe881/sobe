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
    # Nach dem Einsetzen der Suchseite den Index frisch bauen:
    #   npx pagefind --site <statisch-verzeichnis>
    ('suche-seite.html', 'suche/index.html'),
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

MARKER2 = '/* Statische Fassung – stillgelegte Bedienelemente: */'
inhalt = css.read_text(encoding='utf-8', errors='replace')
if MARKER2 not in inhalt:
    inhalt += (
        f'\n{MARKER2}\n'
        '/* Suche und Warenkorb liefen über den WordPress-Server; ein\n'
        '   Bedienelement, das ins Leere führt, ist schlimmer als keines\n'
        '   (und ein sicherer Befund jeder Zertifizierung). Sobald eine\n'
        '   Such- bzw. Shop-Lösung angebunden ist, diesen Block wieder\n'
        '   entfernen. */\n'
        '.awb-menu__overlay-search-trigger,\n'
        '.awb-menu__search-inline,\n'
        'form.searchform,\n'
        '.awb-menu a[aria-label="Warenkorb"],\n'
        '.awb-menu a[href*="warenkorb"],\n'
        'form.cart,\n'
        '.single_add_to_cart_button { display: none !important; }\n')
    css.write_text(inhalt, encoding='utf-8')
    print('CSS: Suche und Warenkorb stillgelegt.')
else:
    print('Stilllegungs-CSS war schon da.')

# --- Suche: Der Suchindex (Pagefind) soll nur den Inhalt erfassen,
# nicht Menüs und Fusszeile – sonst findet jede Suche jede Seite.
# Markiert wird nur die Ordnerfassung jeder Seite (index.html), damit
# die flachen Zwillinge und die ?p=-Duplikate nicht doppelt im Index
# landen; Autoren-Archive bleiben draussen.
markiert = 0
for datei in sorted(WURZEL.rglob('index.html')):
    if 'author' in datei.parts or 'suche' in datei.parts:
        continue
    src = datei.read_text(encoding='utf-8', errors='replace')
    if 'data-pagefind-body' in src:
        continue
    neu = src.replace('<section id="content"',
                      '<section data-pagefind-body id="content"', 1)
    if neu != src:
        datei.write_text(neu, encoding='utf-8')
        markiert += 1
print(f'{markiert} Seiten für den Suchindex markiert.')

# Das Lupen-Symbol im Menü öffnete das WordPress-Suchfeld (tot im
# statischen Abzug, deshalb per CSS ausgeblendet). Es wird zum
# schlichten Link auf die Suchseite: Avada-Klassen des Auslösers und
# die ARIA-Reste des Aufklapp-Verhaltens entfernen, Ziel setzen.
lupen = 0
for datei in sorted(WURZEL.rglob('*.html')):
    if datei.name == '404.html':
        continue
    src = datei.read_text(encoding='utf-8', errors='replace')
    if 'awb-menu__overlay-search-trigger' not in src:
        continue
    tiefe = len(datei.relative_to(WURZEL).parts) - 1
    praefix = '../' * tiefe if tiefe else './'

    def lupe(m: re.Match) -> str:
        global lupen
        tag = m.group(0)
        # Das Lupen-Glyph hängt per ::before an der Auslöser-Klasse –
        # die Ersatzklasse suche-link bekommt dieselbe Regel im
        # Child-Theme-CSS.
        tag = tag.replace(' awb-menu__overlay-search-trigger', ' suche-link')
        tag = tag.replace(' trigger-overlay', '')
        tag = re.sub(r'\s(?:role="button"|aria-expanded="[^"]*"|data-title="[^"]*")', '', tag)
        tag = re.sub(r'href="[^"]*"', f'href="{praefix}suche/index.html"', tag)
        lupen += 1
        return tag

    neu = re.sub(r'<a [^>]*awb-menu__overlay-search-trigger[^>]*>', lupe, src)
    if neu != src:
        datei.write_text(neu, encoding='utf-8')
print(f'{lupen} Lupen-Symbole auf die Suchseite umgelenkt.')

# Reparatur für Anker, die eine frühere Fassung dieses Skripts ohne
# die Ersatzklasse umgeschrieben hat.
repariert = 0
for datei in sorted(WURZEL.rglob('*.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    if 'suche/index.html' not in src or 'suche-link' in src:
        continue
    neu, n = re.subn(
        r'(<a class="[^"]*fusion-main-menu-icon)([^"]*" href="[^"]*suche/index\.html")',
        r'\1 suche-link\2', src)
    if n:
        datei.write_text(neu, encoding='utf-8')
        repariert += n
if repariert:
    print(f'{repariert} Lupen-Anker um die Klasse suche-link ergänzt.')

MARKER3 = '/* Suche (statische Fassung): */'
inhalt = css.read_text(encoding='utf-8', errors='replace')
if MARKER3 not in inhalt:
    inhalt += (
        f'\n{MARKER3}\n'
        '/* Das Lupen-Symbol hing per ::before an der Klasse des alten\n'
        '   WordPress-Such-Overlays; der neue Link zur Suchseite trägt\n'
        '   die Klasse suche-link und braucht dieselbe Regel. */\n'
        '.suche-link:before { content: "\\f002"; font-family: awb-icons;\n'
        '  color: currentColor !important;\n'
        '  font-size: calc(var(--awb-icons-size) * 1px); }\n')
    css.write_text(inhalt, encoding='utf-8')
    print('CSS: Lupen-Symbol für suche-link ergänzt.')

# --- Zusatzskript (Menü-Semantik, Cookie-Balken) einsetzen und auf
# jeder Seite einbinden.
js_vorlage = Path(__file__).with_name('barrierefrei-js.js')
js_ziel = WURZEL / 'barrierefrei.js'
if js_vorlage.is_file():
    js_ziel.write_text(js_vorlage.read_text(encoding='utf-8'), encoding='utf-8')

eingebunden = 0
for datei in sorted(WURZEL.rglob('*.html')):
    # Die 404-Seite wird unter beliebiger Pfadtiefe ausgeliefert –
    # ein relativer Skriptpfad griffe dort ins Leere, und Menüs hat
    # sie keine.
    if datei.name == '404.html':
        continue
    src = datei.read_text(encoding='utf-8', errors='replace')
    if 'barrierefrei.js' in src or '</body>' not in src:
        continue
    tiefe = len(datei.relative_to(WURZEL).parts) - 1
    praefix = '../' * tiefe if tiefe else './'
    src = src.replace(
        '</body>',
        f'<script src="{praefix}barrierefrei.js" defer></script></body>', 1)
    datei.write_text(src, encoding='utf-8')
    eingebunden += 1
print(f'barrierefrei.js auf {eingebunden} Seiten eingebunden.')
