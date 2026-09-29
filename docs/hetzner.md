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
npm install                       # Eleventy und die Suche, sonst nichts
node redaktion/passwort.mjs       # Redaktionspasswort setzen
```

Erster Bau und erste Auslieferung von Hand:

```bash
npm run bauen
mkdir -p ~/public_html/sobe-webseite
cp werkzeuge/hetzner.htaccess ~/public_html/sobe-webseite/.htaccess
cp -r ~/projekt/statisch/. ~/public_html/sobe-webseite/
```

Damit ist die Seite online.

> **Zuerst auf eine Testadresse.** Legen Sie in konsoleH eine Subdomain an,
> etwa `neu.sonnenberg-baar.ch`, mit eigenem Verzeichnis, und liefern Sie
> dorthin aus. Die heutige Seite bleibt unberührt, bis Sie umschalten.

## 2. Node.js in konsoleH einrichten

**Wichtig zuerst:** Das Panel warnt, dass mit dem Aktivieren von Node.js
*alle anderen Webanwendungen unter dieser Domain deaktiviert werden*. Die
Node-Anwendung bekommt dann sämtliche Anfragen dieser Domain – der Apache
liefert dort keine Dateien mehr aus.

Deshalb: **Node.js nur auf einer eigenen Subdomain aktivieren**, etwa
`redaktion.sonnenberg-baar.ch`. Die Domain, unter der die Webseite liegt,
bleibt unangetastet und wird weiterhin vom Apache ausgeliefert – schnell,
und unabhängig davon, ob die Redaktion gerade läuft.

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

`OEFFENTLICH` sagt dem Server, wohin er nach dem Bauen ausliefern soll. Fehlt
die Angabe, baut er nur – aufgeschaltet wird dann nichts.

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
- **Die Seite sieht unformatiert aus.** Die `.htaccess` fehlt:
  `cp werkzeuge/hetzner.htaccess ~/public_html/sobe-webseite/.htaccess`.
  Dateien, die mit einem Punkt beginnen, rührt das Veröffentlichen nicht an –
  eine von Hand abgelegte `.htaccess` bleibt also erhalten.
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
