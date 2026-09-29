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

vorher="$(git rev-parse --short HEAD)"
echo "Stand auf der Platte: $vorher"
echo

echo "1/3  Erzeugten Stand verwerfen …"
git checkout -- statisch/ 2>/dev/null || true
# Nicht nur verfolgte Dateien zurücksetzen: Das Bauen legt auch neue Seiten
# an, die noch nicht im Repository stehen. Liefert der neue Stand dieselbe
# Seite mit, bricht «git pull» daran ab («untracked working tree files would
# be overwritten»). Sie entstehen eine Zeile später ohnehin neu.
git clean -fdq statisch/

echo "2/3  Neuen Stand holen …"
git pull --ff-only

echo "3/3  Seite bauen …"
npm run bauen

nachher="$(git rev-parse --short HEAD)"
echo
if [ "$vorher" = "$nachher" ]; then
  echo "Der Stand hat sich nicht geändert ($nachher) – es gab nichts Neues."
else
  echo "Neuer Stand: $vorher → $nachher"
fi
echo
echo "WICHTIG: Node lädt die Dateien nur beim Start. Jetzt in konsoleH die"
echo "Anwendung stoppen und wieder starten, sonst läuft weiter die alte"
echo "Fassung. Danach prüfen:  <ihre-domain>/api/stand  muss $nachher nennen."
