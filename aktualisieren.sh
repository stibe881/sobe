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

echo "1/4  Erzeugten Stand verwerfen …"
git checkout -- statisch/ 2>/dev/null || true
# Nicht nur verfolgte Dateien zurücksetzen: Das Bauen legt auch neue Seiten
# an, die noch nicht im Repository stehen. Liefert der neue Stand dieselbe
# Seite mit, bricht «git pull» daran ab («untracked working tree files would
# be overwritten»). Sie entstehen eine Zeile später ohnehin neu.
git clean -fdq statisch/

echo "2/4  Neuen Stand holen …"
git pull --ff-only

echo "3/4  Seite bauen …"
npm run bauen

echo "4/4  Auf public_html aufschalten …"
# Ziel wie beim Server: die Umgebungsvariable, sonst der übliche Ort.
ZIEL="${OEFFENTLICH:-$HOME/public_html/sobe-webseite}"

# Dasselbe Verzeichnis zweimal? Der Abgleich löscht im Ziel alles, was
# nicht aus statisch/ stammt. Zeigt das Ziel auf den Projektordner – etwa
# weil der Klon selbst unter public_html/sobe-webseite liegt –, wären das
# der Quelltext, das Redaktionspasswort und die Bestellungen.
aufloesen() { ( cd "$1" 2>/dev/null && pwd -P ) || printf '%s' "$1"; }
PROJEKT="$(pwd -P)"
ZIELP="$(aufloesen "$ZIEL")"
gefaehrlich=""
[ "$ZIELP" = "$PROJEKT" ] && gefaehrlich=ja
case "$PROJEKT/" in "$ZIELP"/*) gefaehrlich=ja ;; esac
case "$ZIELP/" in "$PROJEKT"/*) gefaehrlich=ja ;; esac
if [ -n "$gefaehrlich" ]; then
  echo "    Ziel und Projektordner sind dasselbe ($ZIELP) – nichts aufgeschaltet."
  echo "    Liegt der Klon selbst im Web-Verzeichnis, wird das auch nicht gebraucht:"
  echo "    Node liefert statisch/ direkt aus. OEFFENTLICH einfach leer lassen."
elif [ ! -d "$ZIEL" ]; then
  echo "    $ZIEL gibt es nicht – übersprungen."
  echo "    Liegt die Webseite woanders: OEFFENTLICH=<pfad> ./aktualisieren.sh"
elif command -v rsync >/dev/null 2>&1; then
  # --exclude '.*' schützt Punktdateien auf beiden Seiten: Eine von Hand
  # gelegte .htaccess überlebt das Aufschalten, statt bei jedem Lauf
  # wegzufallen.
  rsync -a --delete --exclude '.*' statisch/ "$ZIEL/"
  echo "    aufgeschaltet nach $ZIEL"
else
  # Ohne rsync von Hand abgleichen. Blosses Kopieren würde nur hinzufügen
  # und überschreiben – eine gelöschte Seite bliebe stehen und wäre weiter
  # abrufbar. Genau so hielten sich die alten WordPress-Ordner.
  # Zuerst räumen, dann kopieren; Punktdateien bleiben unangetastet, damit
  # eine von Hand gelegte .htaccess überlebt.
  ( cd "$ZIEL" && find . -mindepth 1 -name '.*' -prune -o -print ) |
  while IFS= read -r eintrag; do
    [ -e "statisch/${eintrag#./}" ] || rm -rf -- "$ZIEL/${eintrag#./}"
  done
  cp -a statisch/. "$ZIEL/"
  echo "    aufgeschaltet nach $ZIEL (ohne rsync, von Hand abgeglichen)"
fi

nachher="$(git rev-parse --short HEAD)"
echo
if [ "$vorher" = "$nachher" ]; then
  echo "Der Stand hat sich nicht geändert ($nachher) – es gab nichts Neues."
else
  echo "Neuer Stand: $vorher → $nachher"
fi
echo
echo "Die Seiteninhalte sind damit aktuell – sie werden bei jedem Aufruf neu"
echo "von der Platte gelesen."
echo
echo "Hat sich der Redaktionsserver selbst geändert (redaktion/, bauen.mjs,"
echo "vorlagen/*.mjs), braucht es zusätzlich einen Neustart: in konsoleH die"
echo "Node-Anwendung stoppen und wieder starten. Node liest diese Dateien nur"
echo "beim Start. Prüfen mit:  <ihre-domain>/api/stand  muss $nachher nennen."
