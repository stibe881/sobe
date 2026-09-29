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

## Nachträge vom 01.09.2026

- **Prüfung in der Auslieferung:** Der Pages-Workflow führt vor jeder
  Veröffentlichung `werkzeuge/a11y-pruefung.js` aus (axe-core,
  WCAG 2.1/2.2 AA über 18 Seiten inkl. Erklärung und 404-Seite).
  Ein Verstoss stoppt die Veröffentlichung.
- **Kontrast-Graubereiche ausgemessen:** Alle 59 Stellen, die axe als
  «nicht automatisch prüfbar» einstuft (Text auf Verläufen/Fotos),
  wurden pixelgenau gemessen (Text ausblenden, Hintergrund ablichten,
  jedes Pixel gegen die Textfarbe rechnen): **keine** liegt unter der
  Grenze von 4.5:1 bzw. 3:1.
- **PDF-Metadaten:** Alle 33 PDFs tragen jetzt Dokumenttitel und
  Sprachangabe (`werkzeuge/pdf-metadaten.py`); die Tag-Struktur blieb
  unangetastet. Das Tagging der 13 ungetaggten Dateien bleibt offen
  (siehe unten).
- **Eigene 404-Seite** (`statisch/404.html`): barrierefrei, deutsch,
  ohne externe Abhängigkeiten, mit Rückweg zur Startseite.

## Nachträge zur Zertifizierungs-Vorbereitung (01.09.2026)

- **Suche und Warenkorb stillgelegt** (Child-Theme-CSS, Block
  «stillgelegte Bedienelemente»): Beide führten statisch ins Leere –
  ein totes Bedienelement ist ein sicherer Prüfbefund. Der CSS-Block
  ist kommentiert und wird wieder entfernt, sobald eine Such- bzw.
  Shop-Lösung angebunden ist.
- **Menü-Semantik**: `/barrierefrei.js` (auf allen Seiten eingebunden,
  Vorlage `werkzeuge/barrierefrei-js.js`) setzt an Menüpunkten mit
  Untermenü `aria-haspopup`/`aria-expanded` und führt den Zustand bei
  Hover und Tastaturfokus nach; der Cookie-Balken bekommt Rolle und
  Namen. Geprüft: expanded wird bei Fokus «true», bei Fokusverlust
  «false».
- **Lightbox getestet** (kommt nur auf den Mitarbeiter-Profilseiten
  vor, ein Porträt pro Seite): öffnet, Fokus wandert hinein, Escape
  schliesst. Anmerkung für die Prüfung: Der Fokus landet auf einem
  Teilen-Knopf statt auf «Schliessen» – kein Verstoss, aber
  erwähnenswert.
- **`ALT-TEXTE-DURCHSICHT.md`**: 43 Bilder mit leerem alt-Attribut,
  als Checkliste für den redaktionellen Entscheid Schmuck vs.
  Inhalt. Die beschlossenen Texte können danach per Skript auf allen
  betroffenen Seiten eingetragen werden.

## Nachträge vom 01.09.2026, zweite Runde

- **Suche wieder in Betrieb**: clientseitig mit Pagefind (`/suche/`,
  Lupe im Menü führt dorthin). Indexiert wird nur der Inhaltsbereich
  (`data-pagefind-body`), ohne Duplikate und Autoren-Archive; die
  Suchoberfläche ist deutsch beschriftet und tastaturbedienbar.
- **Bestellung per E-Mail**: Jede Produktseite trägt einen gelben
  Knopf «Per E-Mail bestellen» (vorausgefüllte Mail an info@) –
  ersetzt den stillgelegten WooCommerce-Warenkorb
  (`werkzeuge/bestellknopf.py`).
- **Alt-Text-Vorschläge**: Alle 43 Bilder der Durchsichtsliste sind
  gesichtet; unter jedem steht ein Vorschlag (Schmuck oder
  Beschreibung, ohne Namen von Kindern). Nach der Freigabe werden die
  Texte per Skript eingetragen.
- Die Zeitungs-Scans bleiben gemäss Entscheid online und als
  Drittinhalte deklariert.

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

---

# Neue Webseite: Werkzeuge im Kopf

Alles oben Stehende beschreibt die **alte** WordPress-Seite. Die neue
Seite bringt drei Einstellungen mit, die die Besucherin selbst setzt.
Sie liegen hinter dem Knopf mit dem Personen-Zeichen im Kopf – auf dem
Telefon links vom Burger-Menü.

| Einstellung | Was passiert | Wo im Code |
| --- | --- | --- |
| Vorlese-Modus | Eine Leiste am unteren Rand liest den Seiteninhalt vor (Web Speech API). Der gelesene Abschnitt wird gelb hervorgehoben und mitgeführt. | `vorlagen/seite.js`, Abschnitt «Vorlese-Modus» |
| Grössere Schrift | Der Wurzelwert steigt auf 125 %. Alle Schriftgrössen sind in `rem` angegeben, darum wächst die ganze Seite mit. | `html.grossschrift` in `vorlagen/stil.css` |
| Dunkler Modus | Heller Text auf dunklem Grund. | `html.dunkel` in `vorlagen/stil.css` |

Die Wahl liegt in `localStorage` unter `sobe.zugang` und wird schon im
`<head>` gesetzt – sonst blitzt beim Laden kurz die helle Fassung auf.

## Drei Dinge, die dabei schiefgingen

**`--weiss` war zweierlei.** Die Variable stand sowohl für die Fläche
einer Kachel als auch für weisse Schrift auf farbigem Grund. Im dunklen
Modus wurde daraus dunkle Schrift auf dunklem Knopf – der Knopf «Zur
Aufnahme» war unlesbar. Jetzt gibt es `--flaeche` (Fläche) und `--weiss`
(bleibt weiss). Dieselbe Trennung gilt für `--petrol` (Fläche) und
`--tinte` (Schrift).

**Die gelbe Kachel.** Ihr Gelb ist in beiden Fassungen dasselbe. Eine im
dunklen Modus aufgehellte Schriftfarbe wäre darauf blind – dort gilt
weiter die dunkle Schrift.

**Das Menü brach mitten im Wort um.** Bei 125 % Schrift stand da «Über
un s». Die Menüpunkte brechen jetzt nie im Wort; wird es eng, wird die
Leiste zweizeilig.

## Was der Vorlese-Modus nicht ist

Er ist **kein Ersatz für einen Bildschirmleser**. Wer einen benutzt,
braucht ihn nicht – die Seite ist dafür ausgezeichnet. Er ist für
Menschen gedacht, die keinen Bildschirmleser eingerichtet haben und
trotzdem lieber zuhören.

Grenzen, die man kennen muss:

- Er hängt an der Sprachausgabe des Browsers. Fehlt sie, ist der
  Schalter abgeschaltet und sagt das auch – statt still nichts zu tun.
- Welche Stimme kommt, entscheidet das Gerät. Bevorzugt wird eine
  Schweizer, sonst irgendeine deutsche, sonst die Vorgabe.
- Lange Texte werden in Stücke unter 200 Zeichen zerlegt. Mehrere
  Browser brechen das Vorlesen sonst nach etwa fünfzehn Sekunden ohne
  Meldung ab.

# Suche

Die Suche läuft **im Browser** über `statisch/suche.json` – ein
Verzeichnis aller Seiten, das `bauen.mjs` beim Bauen aus genau dem Text
erzeugt, der auch auf der Seite steht. Zurzeit 89 Einträge, rund 130 KB,
geladen erst beim ersten Suchen.

Warum nicht auf dem Server: Die Webseite soll auch dann vollständig
funktionieren, wenn der Apache sie als blosse Dateien ausliefert – ohne
laufendes Node. Eine Suche auf dem Server wäre genau dann weg.

Das Feld im Kopf ist ein echtes `<form>` auf `/suche/`. Ohne JavaScript
landet man dort mit `?q=…` und liest einen Hinweis, statt in einem toten
Feld zu tippen.

**Umlaute:** Die Faltung ist zeichentreu (`ä` → `a`), sonst verschieben
sich alle Fundstellen gegenüber dem Originaltext und der Ausschnitt im
Ergebnis zeigt auf die falsche Stelle. Die Schreibweise «Logopaedie»
wird über Varianten des Suchworts abgedeckt – gesucht werden immer
beide, sonst verschwände «Museum», bloss weil «ue» auch für ü stehen
könnte.
