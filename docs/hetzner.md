# Auf das Hetzner-Webhosting L bringen

Die Seite liegt schon fertig im Repository (`statisch/`). Zum Aufschalten
braucht es nur noch den Weg dorthin. Der Workflow erledigt das automatisch,
sobald die Zugangsdaten hinterlegt sind.

## Was Ihr Paket kann

Webhosting L enthält alles Nötige: SSH-Zugang, 100 GB Platz, SSL, 10 Cronjobs
und Node.js. Für die **öffentliche Seite** wird Node gar nicht gebraucht – sie
besteht aus fertigen Dateien, die der Apache ausliefert. Das ist schnell und
bietet keine Angriffsfläche.

## 1. SSH-Schlüssel anlegen

Auf Ihrem Rechner, nicht auf dem Server:

```bash
ssh-keygen -t ed25519 -C "github-actions sonnenberg" -f ~/.ssh/sonnenberg_deploy
```

Den **öffentlichen** Teil (`~/.ssh/sonnenberg_deploy.pub`) in konsoleH beim
SSH-Zugang hinterlegen. Der **private** Teil bleibt geheim und geht nur in die
GitHub-Geheimnisse (nächster Schritt) – nie ins Repository.

Fingerabdruck des Servers holen, damit die Auslieferung nicht blind vertraut:

```bash
ssh-keyscan -p 22 ihr-server.hosting.hetzner.com
```

## 2. In GitHub hinterlegen

Unter **Settings → Secrets and variables → Actions**:

Als *Secrets* (verschlüsselt, nicht mehr lesbar):

| Name | Inhalt |
| --- | --- |
| `HETZNER_SSH_KEY` | der ganze private Schlüssel, inklusive der BEGIN- und END-Zeilen |
| `HETZNER_KNOWN_HOSTS` | die Ausgabe von `ssh-keyscan` aus Schritt 1 |

Als *Variables* (sichtbar, keine Geheimnisse):

| Name | Beispiel |
| --- | --- |
| `HETZNER_ZIEL` | `benutzer@ihr-server.hosting.hetzner.com` |
| `HETZNER_PFAD` | `/usr/home/benutzer/public_html` |
| `HETZNER_PORT` | `22` (nur nötig, wenn abweichend) |

Solange `HETZNER_ZIEL` leer ist, überspringt der Workflow die Auslieferung –
Sie können also alles vorbereiten, ohne dass etwas passiert.

## 3. Zuerst auf eine Testadresse

**Nicht direkt auf die Hauptdomain.** In konsoleH eine Subdomain anlegen, etwa
`neu.sonnenberg-baar.ch`, mit eigenem Verzeichnis. Dieses Verzeichnis als
`HETZNER_PFAD` eintragen. Die heutige Seite bleibt unberührt, bis Sie
umschalten.

Danach genügt ein Push auf `main` – oder in GitHub unter *Actions* der Knopf
*Run workflow*. Der Lauf baut, prüft die Barrierefreiheit und liefert erst bei
sauberem Ergebnis aus.

## 4. Umschalten auf die Hauptdomain

Wenn die Testadresse stimmt: `HETZNER_PFAD` auf das Verzeichnis der
Hauptdomain ändern und den Workflow erneut laufen lassen.

Vorher sichern, was heute online ist:

```bash
ssh benutzer@ihr-server.hosting.hetzner.com
cp -a public_html public_html-alt-$(date +%Y%m%d)
```

## Das Redaktionssystem

Es gibt es bereits: `statisch/admin/`. Es arbeitet über die GitHub-API –
gespeichert wird als Commit, danach läuft der Workflow und liefert nach
Hetzner aus. Vorteil: keine zweite Anmeldung, keine Datenbank, jede Änderung
ist nachvollziehbar und lässt sich zurücknehmen.

Damit läuft die Kette so:

```
Redaktion speichert  →  Commit auf main  →  Workflow baut und prüft
                                         →  GitHub Pages (Vorschau)
                                         →  Hetzner (öffentlich)
```

## Wenn etwas schiefgeht

- **Der Lauf bricht bei der Barrierefreiheitsprüfung ab.** Gewollt: So kommt
  kein Rückschritt online. Der Bericht im Lauf nennt die Stelle.
- **`Permission denied (publickey)`**: Der öffentliche Schlüssel ist in
  konsoleH noch nicht hinterlegt, oder `HETZNER_ZIEL` stimmt nicht.
- **`Host key verification failed`**: `HETZNER_KNOWN_HOSTS` fehlt oder ist
  veraltet – `ssh-keyscan` erneut ausführen.
- **Die Seite ist da, sieht aber unformatiert aus**: Die `.htaccess` fehlt.
  Der Workflow legt sie mit; von Hand:
  `cp werkzeuge/hetzner.htaccess public_html/.htaccess`.
