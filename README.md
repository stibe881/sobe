# Webseite sonnenberg-baar.ch – statische Fassung ohne WordPress

Dieses Repository enthält die komplette Webseite www.sonnenberg-baar.ch
als eigenständige, statische Webseite – 1:1 übernommen vom laufenden
WordPress (Theme Avada), Stand siehe `STAND.txt`. Sie braucht zum
Betrieb **keinen** WordPress-Server mehr, keine Datenbank und kein PHP:
Jeder einfache Webserver (Nginx, Apache, Netlify, Cloudflare Pages,
GitHub Pages …) kann sie ausliefern.

## Aufbau

- **`statisch/`** – die fertige Webseite. Dieser Ordner ist das, was auf
  den Webserver gehört. Jede Seite liegt unter ihrem bisherigen Pfad
  (`/angebot/sehen/` → `statisch/angebot/sehen/index.html`), damit alle
  bestehenden Links und Suchmaschinen-Einträge weiter stimmen.
- **`quelle/`** – die redaktionell gepflegten Inhalte und ihre
  Vorlagen. Die News-Beiträge liegen hier als einzelne Dateien
  (`quelle/news/`), die Vorlage `_includes/news-rahmen.njk` rendert
  sie im Sonnenberg-Design, `pinnwand.njk` baut die Übersicht mit
  Filter daraus. Der Generator (Eleventy) schreibt das Ergebnis nach
  `statisch/` – lokal mit `cd werkzeuge && npx eleventy
  --config=eleventy.config.js`, in der Pipeline automatisch.
- **`statisch/admin/`** – die **Redaktionsoberfläche**: ein eigenes,
  schlankes System (eine einzige Seite, keine fremde CMS-Software,
  keine fremden Server). Sie spricht direkt mit der GitHub-API;
  Anmeldung mit einem GitHub-Zugangstoken (fein granuliert, nur
  dieses Repository, Contents: Read/Write), auf Wunsch auf dem Gerät
  gemerkt. Vier Bereiche: News, Team, Stelleninserate, Textbausteine
  – mit Bild-Upload samt Alternativtext-Abfrage. Jede Speicherung
  wird ein Commit und läuft automatisch durch Bau und
  Barrierefreiheits-Prüfung. **Hinweis:** Übernommene Alt-Inhalte
  (`.html` mit WordPress-Markup, in der Liste mit 🔒) lassen sich
  bewusst nur löschen, nicht bearbeiten – ihr Layout würde dabei
  beschädigt.
- **`werkzeuge/`** – die Skripte, mit denen diese Fassung erzeugt wurde:
  - `spiegeln.sh` zieht die Seite frisch vom (noch laufenden) WordPress.
  - `nachbearbeiten.py` entfernt danach die WordPress-Reste und macht
    alle verbliebenen absoluten Links relativ.
  - `nachladen.py` holt die Lazy-Load-Bilder, die ein Spiegel übersieht.
- **`.github/workflows/webseite.yml`** – veröffentlicht `statisch/`
  über GitHub Pages als Vorschau: https://stibe881.github.io/sobe/

## Im Browser ansehen

Über GitHub Pages (nach dem ersten Workflow-Lauf):
https://stibe881.github.io/sobe/

Oder lokal:

```bash
cd statisch && python3 -m http.server 8080
# dann http://127.0.0.1:8080 im Browser öffnen
```

Ein Doppelklick auf `index.html` genügt **nicht** – die Seiten liegen
als `ordner/index.html`, dafür braucht es einen Webserver (eine Zeile,
siehe oben).

## Was 1:1 funktioniert

- Alle 164 Seiten der Sitemap: Startseite, Angebots-, Kompetenzen- und
  Über-uns-Seiten, 73 News-Beiträge, 23 Mitarbeiter-Profile,
  Stelleninserate, Produktseiten – samt Bildern, PDFs (Magazine,
  Jahresberichte) und dem kompletten Erscheinungsbild (Avada-CSS/JS
  liegt mit im Ordner).
- Alle Menüs und Untermenüs.
- Die Stellen-Übersicht unter `/jobs/`: Die «Jetzt bewerben»-Knöpfe
  führen wie bisher direkt zum externen Bewerbungsportal
  (recruitingapp-3016.umantis.com) – das läuft unabhängig von WordPress
  weiter.

## Was eine statische Seite prinzipiell nicht kann

Diese Punkte kamen bisher vom WordPress-Server und brauchen einen
Entscheid, bevor das WordPress abgestellt wird:

1. **Shop-Bestellungen** (`/warenkorb/`, `/kasse/`, `/mein-konto/`):
   Warenkorb und Kasse waren WooCommerce und sind stillgelegt. Jede
   Produktseite hat stattdessen einen Knopf «Per E-Mail bestellen»
   (vorausgefüllte Mail an info@, `werkzeuge/bestellknopf.py`). Wer
   später einen echten Warenkorb will: leichtgewichtiger Dienst wie
   Snipcart, und den Stilllegungs-Block im Child-Theme-CSS entfernen.
2. **Kontakt-/Newsletter-Formulare**: Das Formular-Markup ist
   vorhanden, aber der Versand lief über WordPress. Braucht einen
   Formular-Dienst (z. B. Formspree) oder einen kleinen Mail-Endpunkt.
3. **Die Suche** funktioniert wieder – clientseitig mit Pagefind:
   Die Lupe im Menü führt auf `/suche/`, gesucht wird direkt im
   Browser über den eingecheckten Index (`statisch/pagefind/`).
   Nach inhaltlichen Änderungen den Index neu bauen:
   `cd werkzeuge && npx pagefind --site ../statisch`.
4. **Neue Inhalte einpflegen** (News, Stellen, Team, Textbausteine):
   gelöst – über die Redaktionsoberfläche unter `/admin/`, siehe
   Abschnitt «Redaktionell pflegbare Bereiche» unten. Die übrigen
   festen Seiten (Angebot, Über uns …) sind weiterhin gespiegeltes
   HTML; nach dem Muster der Extraktions-Skripte lassen sie sich
   schrittweise ebenfalls pflegbar machen.

## Neu abziehen (solange WordPress noch läuft)

```bash
cd werkzeuge
./spiegeln.sh          # lädt nach ./spiegel/ und bearbeitet nach
```

## Redaktionell pflegbare Bereiche (Stand 02.09.2026)

Über die Redaktionsoberfläche (`/admin/`) pflegbar:

| Bereich | Inhalte | erscheint auf |
| --- | --- | --- |
| News-Beiträge | neue Beiträge (Markdown) | eigener Seite + Pinnwand |
| Team | alle 19 Personen (Name, Funktion, Gruppe, Foto, Mail) | /ueber-uns/organisation/ |
| Stelleninserate | neue Inserate (Titel, Beschrieb, Bewerbungslink) | /jobs/ + eigener Seite |
| Textbausteine | Hinweis zur Platzsituation | /aufnahme/ |

Die Extraktions-Skripte (`werkzeuge/*-extrahieren.py`) dokumentieren,
wie diese Bereiche aus dem WordPress-Abzug herausgelöst wurden – nach
demselben Muster lassen sich weitere Seiten pflegbar machen.
