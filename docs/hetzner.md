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
└── ~/public_html/  ←   erhält bei jedem Veröffentlichen den Inhalt von statisch/
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
npm install                       # Eleventy und die Suche, sonst nichts
node redaktion/passwort.mjs       # Redaktionspasswort setzen
```

Erster Bau und erste Auslieferung von Hand:

```bash
npm run bauen
cp werkzeuge/hetzner.htaccess ~/public_html/.htaccess
rsync -rl --delete ~/projekt/statisch/ ~/public_html/
```

Damit ist die Seite online.

> **Zuerst auf eine Testadresse.** Legen Sie in konsoleH eine Subdomain an,
> etwa `neu.sonnenberg-baar.ch`, mit eigenem Verzeichnis, und liefern Sie
> dorthin aus. Die heutige Seite bleibt unberührt, bis Sie umschalten.

## 2. Redaktionsserver starten

```bash
cd ~/projekt
OEFFENTLICH=/usr/home/benutzer/public_html PORT=3000 node redaktion/server.mjs
```

`OEFFENTLICH` sagt dem Server, wohin er nach dem Bauen ausliefern soll. Fehlt
die Angabe, baut er nur – aufgeschaltet wird dann nichts.

In konsoleH die Node-Anwendung eintragen, damit sie dauerhaft läuft und unter
einer eigenen Adresse erreichbar ist, etwa `redaktion.sonnenberg-baar.ch`:

| Feld | Wert |
| --- | --- |
| Arbeitsverzeichnis | `/usr/home/benutzer/projekt` |
| Startbefehl | `node redaktion/server.mjs` |
| Port | der in konsoleH zugewiesene |
| Umgebung | `OEFFENTLICH=/usr/home/benutzer/public_html` |

> Geht das Dauerbetreiben auf Ihrem Paket nicht, läuft die Redaktion genauso
> auf einem Arbeitsplatzrechner: dort `npm run redaktion`, redigieren, und
> mit `rsync` aufschalten. Die öffentliche Seite merkt davon nichts.

## 3. Arbeiten

Die Redaktion öffnen, mit dem Passwort anmelden. Bearbeitet werden:

| Bereich | Wo es landet |
| --- | --- |
| News-Beiträge | `quelle/news/` → Pinnwand und je eine eigene Seite |
| Stelleninserate | `quelle/stellen/` → Stellenübersicht |
| Team | `quelle/team/` → Organisationsseite |
| Textbausteine | `quelle/texte/` |

Speichern schreibt die Datei. **Veröffentlichen** baut die Seite neu und
liefert sie nach `public_html` aus – das dauert wenige Sekunden.

Beiträge mit 🔒 stammen aus dem alten WordPress; sie lassen sich ansehen und
löschen, aber nicht bearbeiten.

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
- **Die Seite sieht unformatiert aus.** Die `.htaccess` fehlt in
  `public_html`: `cp werkzeuge/hetzner.htaccess ~/public_html/.htaccess`.
- **Nach einem `git pull` fehlt etwas.** `npm install` erneut ausführen.

## Barrierefreiheit

Die Prüfung mit axe-core lief früher bei GitHub. Sie läuft weiterhin, aber
von Hand – auf dem Arbeitsplatzrechner, nicht auf dem Webhosting:

```bash
cd werkzeuge && npm install && npx playwright install chromium
python3 -m http.server 8189 --directory ../statisch &
node a11y-pruefung.js http://127.0.0.1:8189
```

Sinnvoll vor jeder grösseren Änderung am Aufbau der Seite.
