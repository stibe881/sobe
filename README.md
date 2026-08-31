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
   Die Produktseiten sind da, aber Warenkorb und Kasse waren
   WooCommerce. Möglichkeiten: Bestellung per Mail-Link auf den
   Produktseiten, oder ein leichtgewichtiger Dienst (z. B. Snipcart).
2. **Kontakt-/Newsletter-Formulare**: Das Formular-Markup ist
   vorhanden, aber der Versand lief über WordPress. Braucht einen
   Formular-Dienst (z. B. Formspree) oder einen kleinen Mail-Endpunkt.
3. **Die Suche** (Lupe im Menü): fragte WordPress ab. Entweder
   weglassen oder clientseitig nachrüsten (z. B. Pagefind).
4. **Neue Inhalte einpflegen** (News, Stellen, Team): Es gibt kein
   Redaktionssystem mehr. Kleine Textänderungen gehen direkt im HTML;
   für regelmässige News-Pflege wäre der nächste Schritt, die Inhalte
   in einen statischen Generator zu überführen – dieser Abzug ist
   dafür die vollständige Ausgangsbasis.

## Neu abziehen (solange WordPress noch läuft)

```bash
cd werkzeuge
./spiegeln.sh          # lädt nach ./spiegel/ und bearbeitet nach
```
