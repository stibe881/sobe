#!/usr/bin/env python3
"""Rüstet fehlende PDF-Metadaten nach: Dokumenttitel und Sprache.

Warum: Screenreader lesen ohne Titel den Dateinamen vor, und ohne
/Lang raten sie die Vorlesesprache. Beides lässt sich gefahrlos
setzen, ohne die Datei inhaltlich anzufassen – im Gegensatz zum
Tagging, das nur im Layoutprogramm sauber entsteht.

Der Titel entsteht aus dem Dateinamen (Trennzeichen zu Leerzeichen);
gesetzt wird nur, was fehlt. Nach dem Schreiben wird jede Datei
zurückgelesen und geprüft, dass Seitenzahl und Tag-Struktur
unverändert sind – sonst bleibt das Original stehen.

Aufruf: python3 pdf-metadaten.py <statisch-verzeichnis>
"""
import re
import sys
import warnings
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import TextStringObject, NameObject

warnings.filterwarnings('ignore')
WURZEL = Path(sys.argv[1])


def titel_aus_name(name: str) -> str:
    t = re.sub(r'[-_]+', ' ', Path(name).stem)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


geaendert = 0
for pdf in sorted(WURZEL.rglob('*.pdf')):
    try:
        r = PdfReader(str(pdf))
        wurzel = r.trailer['/Root']
        hat_titel = bool((r.metadata or {}).get('/Title'))
        hat_lang = '/Lang' in wurzel
        if hat_titel and hat_lang:
            continue
        seiten_vorher = len(r.pages)
        tags_vorher = '/StructTreeRoot' in wurzel

        w = PdfWriter(clone_from=str(pdf))
        if not hat_titel:
            w.add_metadata({'/Title': titel_aus_name(pdf.name)})
        if not hat_lang:
            w._root_object[NameObject('/Lang')] = TextStringObject('de-CH')

        neu = pdf.with_suffix('.pdf.neu')
        with open(neu, 'wb') as f:
            w.write(f)

        pruef = PdfReader(str(neu))
        if (len(pruef.pages) != seiten_vorher
                or ('/StructTreeRoot' in pruef.trailer['/Root']) != tags_vorher):
            neu.unlink()
            print(f'  ÜBERSPRUNGEN (Prüfung schlug fehl): {pdf.name}')
            continue
        neu.replace(pdf)
        geaendert += 1
    except Exception as e:
        print(f'  FEHLER {pdf.name}: {e}')

print(f'{geaendert} PDFs mit Titel/Sprache ergänzt.')
