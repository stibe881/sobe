#!/usr/bin/env bash
# Zieht www.sonnenberg-baar.ch komplett vom laufenden WordPress und
# bereitet den Abzug als eigenständige statische Webseite auf.
#
# Läuft nur, solange das WordPress noch erreichbar ist – danach ist
# webseite/statisch/ der massgebliche Stand.
#
# Ablauf (jeder Schritt steckt in einem Fehler, der wirklich passiert ist):
#   1. wget-Spiegel über die Link-Struktur.
#   2. Zweiter Lauf über die Sitemap: Mitarbeiter-Profile und
#      Verantwortungs-Seiten sind nirgends verlinkt und fehlen sonst.
#   3. Lazy-Load-Bilder nachladen: Avada legt responsive Varianten in
#      data-srcset ab, das wget nicht liest – ohne diesen Schritt fehlen
#      ~600 Bilddateien.
#   4. Nachbearbeiten (WordPress-Reste, Ordner-Kopien, Relativierung).
set -euo pipefail
cd "$(dirname "$0")"

ZIEL=${1:-spiegel}
DOMAIN=www.sonnenberg-baar.ch
WGET_OPTS=(--mirror --page-requisites --adjust-extension --convert-links
  --restrict-file-names=windows --no-parent -e robots=off
  --wait=0.15 --tries=3 --timeout=30
  --domains=$DOMAIN,sonnenberg-baar.ch
  --reject-regex '(wp-json|xmlrpc|wp-login|/feed/?$|add-to-cart|replytocom|trackback|\?s=|wc-ajax|\?attachment_id|/comments/)')

echo "== 1/4: Seite spiegeln"
wget "${WGET_OPTS[@]}" -P "$ZIEL" "https://$DOMAIN/" || [ $? -eq 8 ]

echo "== 2/4: Sitemap-Seiten ergänzen (unverlinkte Profile usw.)"
python3 - "$ZIEL/$DOMAIN" <<'PY' > /tmp/sitemap-fehlt.txt
import re, sys, urllib.request
from pathlib import Path
from urllib.parse import urlparse
wurzel = Path(sys.argv[1])
urls = []
index = urllib.request.urlopen('https://www.sonnenberg-baar.ch/sitemap.xml').read().decode()
for teil in re.findall(r'<loc>([^<]+)</loc>', index):
    urls += re.findall(r'<loc>([^<]+)</loc>', urllib.request.urlopen(teil).read().decode())
for url in urls:
    pfad = urlparse(url).path.strip('/')
    kandidaten = [wurzel / 'index.html'] if not pfad else [
        wurzel / pfad / 'index.html', wurzel / (pfad + '.html')]
    if not any(k.is_file() for k in kandidaten):
        print(url)
PY
if [ -s /tmp/sitemap-fehlt.txt ]; then
  wget "${WGET_OPTS[@]}" --level=1 -P "$ZIEL" -i /tmp/sitemap-fehlt.txt || [ $? -eq 8 ]
fi

echo "== 3/4: Lazy-Load-Bilder und per JS geladene Dateien ergänzen"
python3 nachladen.py "$ZIEL/$DOMAIN"

echo "== 4/4: Nachbearbeiten"
python3 nachbearbeiten.py "$ZIEL/$DOMAIN"

echo
echo "Fertig. Die Webseite liegt in $ZIEL/$DOMAIN/ –"
echo "Inhalt von dort nach ../statisch/ übernehmen, wenn alles stimmt."
