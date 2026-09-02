#!/usr/bin/env python3
"""Trägt die beschlossenen Alternativtexte in alle Seiten ein.

Quelle der Texte ist die redaktionelle Durchsicht in
ALT-TEXTE-DURCHSICHT.md (Vorschläge vom 01.09.2026). Schmuckbilder
behalten ihr leeres alt-Attribut – das ist für Screenreader korrekt.

Gesetzt wird nur, wo alt fehlt oder leer ist; vorhandene Texte bleiben
unangetastet. Bearbeitet werden die ausgelieferten Seiten (statisch/)
UND die Inhaltsdateien (quelle/news/), damit der Generator die Texte
nicht wieder überschreibt.

Aufruf: python3 alt-texte-eintragen.py <repo-wurzel>
"""
import re
import sys
from pathlib import Path

WURZEL = Path(sys.argv[1])

# Bild-Stammname → Alternativtext. Schmuckbilder stehen bewusst nicht
# in der Liste. Grössenvarianten (-400x267 usw.) zählen zum Stamm.
ALT_TEXTE = {
 '0005_GP_Drohnenaufnahme-2023-scaled': 'Luftaufnahme des SONNENBERG-Areals in Baar mit den Schulgebäuden',
 '0005_GP_Drohnenaufnahme-2023': 'Luftaufnahme des SONNENBERG-Areals in Baar mit den Schulgebäuden',
 '2023_Franziska-Elmer': 'Porträt von Franziska Elmer',
 '2023_Katinka-Probst': 'Porträt von Katinka Probst',
 '2023_Nora-Wieland': 'Porträt von Nora Wieland',
 '2023_Ronald-Junkert': 'Porträt von Ronald Junkert in Kochschürze',
 '2023_Stefan-Gross': 'Porträt von Stefan Gross',
 '2024_Adrian-Vollenweider-scaled': 'Porträt von Adrian Vollenweider',
 '250929-Tenero-Weekend_2': 'Jugendliche mit Stand-up-Paddles am Seeufer im Tessin',
 '250929-Tenero-Weekend_8-1': 'Zwei Jugendliche klettern an einer hohen Kletterwand',
 '251013-Spendenmailing-1_freigestellt': 'Lächelndes Mädchen vor grünen Sträuchern',
 '437-G-046-20240605_105004_HMMRZ62_1326-NEF_DxO_DeepPRIME-e1768578163543': 'Nahaufnahme: eine Hand malt mit Pinsel und grüner Farbe',
 '642-M-023-20240905_140918_HMMRDSC_6752-NEF_DxO_DeepPRIME-e1768578442785': 'Therapieraum mit Spezial-Stehstuhl; im Hintergrund arbeitet ein Jugendlicher im Rollstuhl an einem Tisch',
 'DJI_20260503142003_0070_D': 'Luftaufnahme eines Fussballplatzes zwischen Fluss und Wald',
 'DSC06096': 'Vier junge Fussballer stehen jubelnd zusammen auf dem Spielfeld',
 'Fim1': 'Logo von «Football is more»',
 'Fim2': 'Sechs Trikots in verschiedenen Farben mit Vereinswappen, nebeneinander ausgelegt',
 'Foto-1-Lesung-Kaminski-Kids': 'Autor Carlo Meier liest auf der Bühne aus einem Buch vor',
 'Roman-Della-Rossa-2025_bea-scaled-e1754290066849': 'Porträt von Roman Della Rossa',
 'Skigebiet-Tschugge': 'Verschneites Skigebiet mit Pisten unter blauem Himmel',
 'Skilager-Sehen-26-18': 'Gruppe in Leuchtwesten beim Langlaufen auf verschneiter Loipe',
 'Skilager-Sehen-26-4': 'Skifahrer auf einer breiten, verschneiten Piste',
 'Verhalten-Plus-scaled-e1713173956219': 'Von oben: Kinder braten Schlangenbrot über einer Feuerstelle',
 'button-freie-plaetze2': 'Freie Plätze in der Wohn- und Tagesstruktur verfügbar',
 'csm_Beno_und_Flecki_1e9976a49b': 'Buchdeckel «Beno und Flecki»',
 'csm_Beno_und_Flecki_335cf07c0b': 'Bilderbuch «Beno und Flecki» mit Holzfiguren von Beno und Hund Flecki',
 'csm_Leo_deckt_den_Tisch_0968996bd5': 'Holzfiguren zum Bilderbuch «Leo deckt den Tisch»',
 'csm_Lotta_kauft_ein_Kleid_bb663a9231': 'Buchdeckel «Lotta kauft ein Kleid»',
 'csm_Lotta_kauft_ein_Kleid_dfab7574ba': 'Holzfiguren zum Bilderbuch «Lotta kauft ein Kleid»',
 'csm_Mia_packt_den_Koffer_1a0568e0cf': 'Holzfigur Mila mit dem Bilderbuch «Mila packt den Koffer»',
 'csm_Mila_packt_den_Koffer_cbf56b3c2c': 'Buchdeckel «Mila packt den Koffer»',
 'csm_Tino_und_Lena_06d3fe7cd6': 'Holzfiguren zum Bilderbuch «Tino und Lena machen Apfelsaft» mit Apfel',
 'csm_Tino_und_Lena_mache_Apfelsaft_3cdc689b26': 'Buchdeckel «Tino und Lena machen Apfelsaft»',
 'csm_Titelbild_Buch_Vorhang_auf_d47948c9c7': 'Buchdeckel «Blind oder sehbehindert – Vorhang auf!»',
 'csm_Wenn_anders_Sehen_zur_Hersausforderung_wird_0372d9a339': 'DVD-Hülle «Wenn anders Sehen zur Herausforderung wird»',
 'csm_be25e1c0b15e1e0141e65d2ec78c6a14-r250x250_1__134fcf18f7': 'Buchdeckel «Leo deckt den Tisch»',
 'csm_sehreisen_18863be563': 'Set «Sehreisen mit Lotta, Leo, Tino, Lena, Beno und Flecki»',
}


def stamm(dateiname: str) -> str:
    name = dateiname.rsplit('.', 1)[0]
    return re.sub(r'-\d+x\d+$', '', name)


IMG = re.compile(r'<img[^>]*>')
gesetzt = 0
dateien = 0
for bereich in ('statisch', 'quelle/news'):
    for datei in sorted((WURZEL / bereich).rglob('*.html')):
        src = datei.read_text(encoding='utf-8', errors='replace')

        def ersetzen(m: re.Match) -> str:
            global gesetzt
            tag = m.group(0)
            alt = re.search(r'alt="([^"]*)"', tag)
            if alt and alt.group(1).strip():
                return tag
            quelle = (re.search(r'data-orig-src="([^"]+)"', tag)
                      or re.search(r'\bsrc="(?!data:)([^"]+)"', tag))
            if not quelle:
                return tag
            text = ALT_TEXTE.get(stamm(quelle.group(1).split('/')[-1]))
            if not text:
                return tag
            gesetzt += 1
            if alt:
                return tag.replace(alt.group(0), f'alt="{text}"', 1)
            return tag[:-1].rstrip('/').rstrip() + f' alt="{text}" />'

        neu = IMG.sub(ersetzen, src)
        if neu != src:
            datei.write_text(neu, encoding='utf-8')
            dateien += 1

print(f'{gesetzt} Alt-Texte in {dateien} Dateien gesetzt.')
