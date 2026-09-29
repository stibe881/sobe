# Webseite und Redaktion auf dem eigenen Webhosting

Alles läuft auf Ihrem Hetzner-Webhosting L. GitHub ist nur noch Ablage und
Versionsverlauf – kein Dienst dort baut oder veröffentlicht etwas.

```
Hetzner Webhosting L
├── ~/projekt/          Klon des Repositories
│   ├── quelle/         Inhalte – das bearbeitet die Redaktion
│   ├── statisch/       die gebaute Webseite
│   ├── redaktion/      der Redaktionsserver (Node.js)
│   └── werkzeuge/      Eleventy-Konfiguration
└── ~/public_html/sobe-webseite/  ←  erhält beim Veröffentlichen den Inhalt von statisch/
```

Die **öffentliche Seite** braucht kein Node: Der Apache liefert fertige
Dateien aus. Node läuft nur für die **Redaktion**.

---

## 1. Einmalig einrichten

```bash
ssh benutzer@ihr-server.hosting.hetzner.com

echo 22 > ~/.nodeversion          # Node 22 (20 und 24 gehen auch)
node --version                    # zur Kontrolle

git clone https://github.com/stibe881/sobe-webseite.git ~/projekt
cd ~/projekt
node redaktion/passwort.mjs       # Redaktionspasswort setzen
```

Erster Bau und erste Auslieferung von Hand:

```bash
npm run bauen
```

`public_html` aufräumen und die Seite ablegen. **Vorher sichern** – was dort
liegt, ist danach weg:

```bash
cd ~
cp -a public_html public_html-sicherung-$(date +%Y%m%d)   # Rettungsanker
rm -rf public_html/*  public_html/.htaccess               # aufräumen

mkdir -p public_html/sobe-webseite
cp -r ~/projekt/statisch/. public_html/sobe-webseite/
cp ~/projekt/werkzeuge/hetzner.htaccess public_html/sobe-webseite/.htaccess
cp ~/projekt/werkzeuge/wurzel.htaccess  public_html/.htaccess
```

Die zweite `.htaccess` liegt in `public_html` selbst und enthält nur eine
Weiterleitung: Wer die blosse Domain aufruft, landet auf der Webseite im
Unterverzeichnis. Ohne sie zeigt die Domainwurzel ins Leere.

Die Seite ist dann unter `ihre-domain.ch/sobe-webseite/` erreichbar.

Das **Redaktionssystem gehört nicht nach `public_html`** – es bleibt in
`~/projekt` und wird über seine eigene Adresse erreicht (Schritt 2).

Damit ist die Seite online.

> **Zuerst auf eine Testadresse.** Legen Sie in konsoleH eine Subdomain an,
> etwa `neu.sonnenberg-baar.ch`, mit eigenem Verzeichnis, und liefern Sie
> dorthin aus. Die heutige Seite bleibt unberührt, bis Sie umschalten.

## 2. Node.js in konsoleH einrichten

**Wichtig zuerst:** Das Panel warnt, dass mit dem Aktivieren von Node.js
*alle anderen Webanwendungen unter dieser Domain deaktiviert werden*. Die
Node-Anwendung bekommt dann sämtliche Anfragen dieser Domain – der Apache
liefert dort keine Dateien mehr aus.

Daraus folgen zwei gangbare Wege.

**Weg A – getrennt (empfohlen).** Node.js nur auf einer eigenen Subdomain
aktivieren, etwa `redaktion.sonnenberg-baar.ch`. Die Domain, unter der die
Webseite liegt, bleibt unangetastet und wird weiterhin vom Apache
ausgeliefert – schnell, und unabhängig davon, ob die Redaktion gerade
läuft. Fällt Node aus, steht die Webseite trotzdem.

**Weg B – alles über Node.** Node.js auf der Domain der Webseite selbst
aktivieren. Dann liefert der Server beides aus:

| Adresse | Was kommt |
| --- | --- |
| `ihre-domain.ch/` | die Webseite |
| `ihre-domain.ch/redaktion/` | die Anmeldung zur Redaktion |

Die Wurzel gehört dabei bewusst der Webseite. Lag die Redaktion dort,
bekamen Besucher die Anmeldemaske statt der Startseite zu sehen – genau
das ist beim ersten Versuch passiert.

Weg B ist der kürzere, hat aber einen Preis: Steht Node still, ist auch
die Webseite weg. Für eine Testadresse ist das in Ordnung, für die
öffentliche Seite ist Weg A der ruhigere.

Werte für die Maske (Ihr Zuhause ist `/usr/home/e3z3sy`, der Klon liegt in
`projekt`):

| Feld | Wert |
| --- | --- |
| Skript-Pfad | `app.js` |
| Arbeitsverzeichnis | `projekt` |
| Name der Log-Datei | `redaktion.log` |
| Arbeitsspeicher-Beschränkung | leer lassen |
| Version | `24` |
| Skript-Parameter | keine |

Bei den **Umgebungsvariablen** eintragen:

| Schlüssel | Wert |
| --- | --- |
| `OEFFENTLICH` | `/usr/home/e3z3sy/public_html/sobe-webseite` |
| `ANTHROPIC_API_KEY` | der Schlüssel für die Übersetzungen (siehe `docs/sprachen.md`) |

`OEFFENTLICH` sagt dem Server, wohin er nach dem Bauen ausliefern soll. Fehlt
die Angabe, baut er nur – aufgeschaltet wird dann nichts.

`ANTHROPIC_API_KEY` schaltet die Übersetzung ins Französische, Italienische
und Englische frei; sie läuft beim Veröffentlichen von selbst mit. Fehlt der
Schlüssel, wird nicht übersetzt und die noch nicht übersetzten Stellen
bleiben deutsch – aufgeschaltet wird trotzdem. Einzelheiten in
`docs/sprachen.md`.

Den Port setzt Hetzner selbst; der Server übernimmt ihn aus `PORT`.

Zum Ausprobieren auf der Kommandozeile geht es auch ohne Panel:

```bash
cd ~/projekt
OEFFENTLICH=~/public_html/sobe-webseite PORT=3000 node app.js
```

> Geht das Dauerbetreiben auf Ihrem Paket nicht, läuft die Redaktion genauso
> auf einem Arbeitsplatzrechner: dort `npm run redaktion`, redigieren, und
> mit `rsync` aufschalten. Die öffentliche Seite merkt davon nichts.

## 3. Arbeiten

Die Redaktion unter `/redaktion/` öffnen und mit dem Passwort anmelden.
Links stehen die Bereiche:

| Bereich | Was sich ändern lässt | Datei |
| --- | --- | --- |
| Übersicht | Zahlen, schnelle Wege, laufender Stand | – |
| Beiträge | Aktuelles mit Bild, Datum und Kategorien | `quelle/news/` |
| Offene Stellen | Inserate samt Bereich, Pensum und Eintritt | `quelle/stellen/` |
| Team | Personen mit Foto, Funktion und Gruppe | `quelle/team/` |
| Textbausteine | einzelne Texte auf festen Seiten | `quelle/texte/` |
| Seiten | die festen Seiten und ihre Bausteine | `inhalt/seiten.json` |
| Bilder | Bildbestand ansehen, hochladen, löschen | `bilder/`, `statisch/wp-content/uploads/` |
| Sprachen | offene Übersetzungen nachführen und nachbessern | `inhalt/uebersetzungen/` |
| Menü & Fusszeile | Menüpunkte, Knöpfe, Zeile im Fuss | `inhalt/einstellungen.json` |
| Spenden | Beträge, Zwecke, Zahlungsarten, Konto | `inhalt/einstellungen.json` |
| Einstellungen | Name, Adresse, Telefon, E-Mail | `inhalt/einstellungen.json` |

Speichern schreibt die Datei. **Veröffentlichen** baut die Webseite neu und
liefert sie nach `public_html` aus – das dauert wenige Sekunden. Bis dahin
bleibt die Webseite, wie sie ist.

Beiträge mit einem Schloss stammen aus dem alten WordPress. Ihr Text ist
rohes HTML; ein Textfeld würde ihn beim ersten Speichern stillschweigend
zerlegen. Sie lassen sich ansehen und löschen, aber nicht bearbeiten.

### Seiten aus Bausteinen

Eine feste Seite ist eine Reihe von Bausteinen, die im Raster je zu einer
Kachel werden. Jeder Baustein hat eine Breite (ein Drittel bis ganze
Breite) und je nach Art Titel, Text, Links oder ein Bild. Bausteine lassen
sich hinzufügen, verschieben und entfernen.

Jede Baustein-Art hier hat ihr Gegenstück in `vorlagen/bausteine.mjs`. Wer
dort eine Art ergänzt, ergänzt sie auch in `redaktion/oberflaeche.js` unter
`BAUSTEIN_PLAN` – sonst lässt sie sich nicht bearbeiten. Eine Art, die die
Oberfläche nicht kennt, wird beim Speichern unverändert durchgereicht statt
still verworfen.

### Was die Redaktion nicht darf

Schreiben kann sie nur in `quelle/`, `inhalt/`, `bilder/` und
`statisch/wp-content/uploads/`. Vorlagen, Skripte und der Server selbst
bleiben dem Repository vorbehalten: Ein Redaktionssystem, das seinen
eigenen Code überschreiben kann, ist keines mehr.

## Neuen Stand holen

```bash
cd ~/projekt
./aktualisieren.sh
```

Das verwirft den erzeugten Stand in `statisch/`, holt den neuen Code, prüft
die Abhängigkeiten und baut die Seite. Danach in der Redaktion
«Veröffentlichen» drücken.

## 4. Sichern

Der ganze Inhalt sind Dateien. Nach grösseren Änderungen:

```bash
cd ~/projekt
git add quelle statisch
git commit -m "Redaktion: Stand $(date +%F)"
git push
```

Das ist die Sicherung und gleichzeitig der Verlauf: Jede Fassung lässt sich
zurückholen. Ein Cronjob kann das auch nachts erledigen.

## Wenn etwas schiefgeht

- **«Veröffentlichen» meldet einen Fehler.** Die Meldung nennt die Stelle.
  Meist ist ein Feld leer, das nicht leer sein darf. Die Seite bleibt
  unverändert online – ein misslungener Bau schaltet nichts auf.
- **Anmeldung klemmt.** Nach fünf Fehlversuchen ist eine Viertelstunde Ruhe.
  Passwort vergessen: `node redaktion/passwort.mjs` setzt ein neues.
- **Die Seite sieht unformatiert aus.** Die `.htaccess` fehlt:
  `cp werkzeuge/hetzner.htaccess ~/public_html/sobe-webseite/.htaccess`.
  Dateien, die mit einem Punkt beginnen, rührt das Veröffentlichen nicht an –
  eine von Hand abgelegte `.htaccess` bleibt also erhalten.
- **`git pull` bricht ab** mit «Your local changes would be overwritten»:
  `statisch/` wird beim Bauen überschrieben und ist darum auf dem Server
  immer verändert. Nehmen Sie `./aktualisieren.sh` – das verwirft den
  erzeugten Stand, holt den neuen und baut. Von Hand:
  `git checkout -- statisch/ && git pull`.
- **Nach einem `git pull` fehlt etwas.** `./aktualisieren.sh` holt und baut
  in einem Zug.

## Barrierefreiheit

Die Prüfung mit axe-core läuft von Hand auf dem Arbeitsplatzrechner, nicht
auf dem Webhosting (sie bringt eigene Abhängigkeiten mit):

```bash
cd werkzeuge && npm install && npx playwright install chromium
python3 -m http.server 8189 --directory ../statisch &
node a11y-pruefung.js http://127.0.0.1:8189
```

Sinnvoll vor jeder grösseren Änderung am Aufbau der Seite.
