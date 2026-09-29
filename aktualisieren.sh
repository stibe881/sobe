#!/usr/bin/env bash
# Holt den neuen Stand auf den Server und baut die Seite neu.
#
# Warum es dieses Skript braucht: statisch/ liegt im Repository und wird beim
# Bauen überschrieben. Auf dem Server sind diese Dateien darum nach jedem
# Veröffentlichen verändert, und ein blosses «git pull» bricht ab. Hier wird
# der erzeugte Stand zuerst verworfen – verloren geht dabei nichts, er
# entsteht eine Zeile später neu.
set -euo pipefail
cd "$(dirname "$0")"

echo "1/4  Erzeugten Stand verwerfen …"
git checkout -- statisch/ 2>/dev/null || true

echo "2/4  Neuen Stand holen …"
git pull --ff-only

echo "3/4  Abhängigkeiten prüfen …"
npm install --no-audit --no-fund

echo "4/4  Seite bauen …"
npm run bauen

echo
echo "Fertig. Zum Aufschalten entweder in der Redaktion «Veröffentlichen»"
echo "drücken oder von Hand:"
echo "  cp -r statisch/. \"\${OEFFENTLICH:-\$HOME/public_html/sobe-webseite}/\""
