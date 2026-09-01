# Barrierefreiheit – Stand und Nachweise

Die **Erklärung zur Barrierefreiheit ist eingebaut**: Sie liegt unter
`statisch/barrierefreiheit/index.html`, ist auf jeder Seite in der
Fusszeile neben Impressum und Datenschutzerklärung verlinkt und nennt
den Feedback-Kontakt. Die Vorlage für frische Abzüge liegt in
`werkzeuge/barrierefreiheit-seite.html`; `werkzeuge/barrierefrei.py`
setzt sie ein und verlinkt sie.

## Was geprüft wurde (31.08./01.09.2026)

- **Automatisiert (axe-core)** über 16 repräsentative Seiten gegen
  WCAG 2.1 A/AA **und** die zusätzlichen Kriterien der WCAG 2.2 AA:
  nach den Korrekturen **0 Verstösse** auf allen Seiten.
- **Tastatur:** Alle Menüs samt Untermenüs sind per Tab erreichbar,
  Untermenüs werden bei Fokus sichtbar, der Fokus ist überall
  sichtbar, der Sprunglink «Zum Inhalt springen» funktioniert (er war
  durch die Spiegelung auf falsche Ziele geraten und ist korrigiert).
- **Reflow:** 320 px Fensterbreite ohne horizontales Scrollen auf
  allen Stichproben.
- **Medien:** keine Video-/Audio-Einbettungen, also keine offenen
  Untertitel-/Transkript-Pflichten.
- **PDF-Bestand (33 Dateien):** alle mit Textebene; 20 getaggt
  (Grundlage für PDF/UA), 13 ohne Tag-Struktur – überwiegend
  eingescannte Zeitungsartikel Dritter, dazu einzelne ältere
  Eigenpublikationen. In der Erklärung deklariert.

## Behobene Befunde

1. 293 Icon-Links (v. a. Warenkorb) ohne zugänglichen Namen →
   `aria-label`.
2. 39 Produkt-/Teaser-Kacheln, deren Klickfläche nur ein Bild
   enthielt → `aria-label` aus der Folgeüberschrift.
3. Google-Maps-Karte auf /kontakt/ ohne Titel → `title`.
4. Datenschutz-Link im Cookie-Balken nur farblich erkennbar →
   unterstrichen (Child-Theme-CSS).
5. Sprunglinks aller ~290 Seiten zeigten auf Dateien statt auf
   `#content` → korrigiert.

Alle Korrekturen sind in `werkzeuge/barrierefrei.py` festgehalten und
auf einem frischen Abzug wiederholbar.

## Was noch aussteht

- **Prüfung mit echten Screenreadern** (NVDA/JAWS/VoiceOver) durch
  geübte Nutzerinnen und Nutzer – als Kompetenzzentrum Sehen hat der
  SONNENBERG die Fachpersonen dafür im Haus.
- **Ältere eigene PDFs nachtaggen** (Magazin-Ausgaben 52/55/56,
  Jubiläumsbroschüre, Spendenreglement) – braucht das
  Layoutprogramm (InDesign/Acrobat); bei Neuauflagen direkt
  barrierefrei exportieren.
- **Externe Zertifizierung**, wenn maximale Rechtssicherheit gewünscht
  ist: Die Stiftung «Zugang für alle» prüft nach eCH-0059.

## Rechtlicher Rahmen (Kurzfassung)

- **Schweiz:** BehiG und eCH-0059 (WCAG 2.1 AA) für Bund und Träger
  öffentlicher Aufgaben.
- **EU:** European Accessibility Act (2019/882, seit 28.06.2025) –
  erfasst u. a. Webshops mit Angebot an EU-Konsumenten; Norm
  EN 301 549 (WCAG 2.1 AA).
- Erklärung zur Barrierefreiheit mit Feedback-Kanal: vorhanden (siehe
  oben).
