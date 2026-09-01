#!/usr/bin/env python3
"""Setzt auf jede Produktseite einen «Per E-Mail bestellen»-Knopf.

Der WooCommerce-Warenkorb lief über den WordPress-Server und ist im
statischen Abzug stillgelegt (siehe Child-Theme-CSS). Bis eine
Shop-Lösung angebunden ist, ersetzt ihn eine vorausgefüllte
Bestell-Mail an info@sonnenberg-baar.ch – einfach und barrierefrei.

Der Knopf nutzt die WooCommerce-Klassen «button alt», also dieselbe
Gestaltung wie der frühere Warenkorb-Knopf. Eingefügt wird direkt
nach dem (ausgeblendeten) Kaufformular; läuft mehrfach ohne Schaden.

Aufruf: python3 bestellknopf.py <statisch-verzeichnis>
"""
import html
import re
import sys
import urllib.parse
from pathlib import Path

WURZEL = Path(sys.argv[1])
MARKER = 'bestellung-per-mail'

eingesetzt = 0
for datei in sorted((WURZEL / 'produkt').rglob('*.html')):
    src = datei.read_text(encoding='utf-8', errors='replace')
    if MARKER in src or 'class="cart"' not in src:
        continue
    titel = re.search(r'<title>([^<]*?)\s*-\s*SONNENBERG', src)
    name = html.unescape(titel.group(1)).strip() if titel else 'Produkt'
    betreff = urllib.parse.quote(f'Bestellung: {name}')
    rumpf = urllib.parse.quote(
        'Guten Tag\n\n'
        f'Ich bestelle: {name}\n'
        'Anzahl: \n\n'
        'Lieferadresse:\n\n\n'
        'Freundliche Grüsse\n')
    knopf = (
        f'<p class="{MARKER}">'
        f'<a class="button alt" href="mailto:info@sonnenberg-baar.ch'
        f'?subject={betreff}&amp;body={rumpf}">Per E-Mail bestellen</a></p>')

    neu, n = re.subn(r'(<form class="cart"[\s\S]*?</form>)',
                     r'\1' + knopf, src, count=1)
    if n:
        datei.write_text(neu, encoding='utf-8')
        eingesetzt += 1
print(f'{eingesetzt} Produktseiten mit Bestellknopf versehen.')

# Gestaltung: Die WooCommerce-Knopfklassen werden vom Theme hier nicht
# gefüllt (der Knopf sähe wie ein Textlink aus) – deshalb eine eigene
# Regel im Stil der gelben Sonnenberg-Knöpfe («Jetzt bewerben»).
css = WURZEL / 'wp-content/themes/Avada-Child-Theme/style.css@ver=7.1.css'
MARKER_CSS = '/* Bestellknopf (statische Fassung): */'
inhalt = css.read_text(encoding='utf-8', errors='replace')
if MARKER_CSS not in inhalt:
    inhalt += (
        f'\n{MARKER_CSS}\n'
        '.bestellung-per-mail .button {\n'
        '  display: inline-block; padding: 13px 29px; border-radius: 2px;\n'
        '  background: #f0b91d; color: #17383e !important;\n'
        '  font-weight: 700; text-decoration: none; }\n'
        '.bestellung-per-mail .button:hover,\n'
        '.bestellung-per-mail .button:focus { background: #ffd04a; }\n')
    css.write_text(inhalt, encoding='utf-8')
    print('CSS für den Bestellknopf ergänzt.')
