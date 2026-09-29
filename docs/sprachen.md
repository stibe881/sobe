# Vier Sprachen

Die Webseite gibt es auf **Deutsch, Französisch, Italienisch und Englisch**.
Deutsch ist die Quelle; alles andere ist Übersetzung davon.

```
statisch/        Deutsch          sonnenberg-baar.ch/
statisch/fr/     Französisch      sonnenberg-baar.ch/fr/
statisch/it/     Italienisch      sonnenberg-baar.ch/it/
statisch/en/     Englisch         sonnenberg-baar.ch/en/
```

Bilder, Stylesheet und Skript liegen nur einmal an der Wurzel – sie sind in
allen Sprachen dieselben.

## Wo die Übersetzungen stehen

`inhalt/uebersetzungen/fr.json` (und `it`, `en`). **Der Schlüssel ist der
deutsche Satz selbst**, nicht eine erfundene Kennung:

```json
{
  "Zum Inhalt springen": "Aller au contenu",
  "Offene Stellen": "Postes ouverts"
}
```

Das hat einen Preis und einen Vorteil. Der Preis: Ändert sich der deutsche
Satz, ist seine Übersetzung weg und muss neu gemacht werden. Der Vorteil:
Fehlt eine Übersetzung, steht auf der Seite der richtige deutsche Satz – und
nicht `seite.titel.3`. Für ein Haus, das seine Webseite selbst pflegt, wiegt
das schwerer.

`inhalt/uebersetzungen/fehlend.json` entsteht bei jedem Bau und listet, was
noch offen ist. Daraus arbeiten das Werkzeug und die Redaktion.

## Was übersetzt wird

**Feste Sätze der Oberfläche** stehen im Code in `t('…')` – Menü, Knöpfe,
die Barrierefreiheits-Schalter, das Spendenformular, die Suche. Diese 75
Sätze sind für alle drei Sprachen von Hand eingetragen und geprüft.

**Inhalte** – Seitentitel, Texte, Beiträge, Stelleninserate – werden vor dem
Zeichnen übersetzt, nicht in den Vorlagen. Das steht in
`vorlagen/sprache.mjs` unter `inhaltUebersetzen`: Eine Liste von
Schlüsseln (`titel`, `text`, `absaetze`, `alt` …) sagt, was Text ist. Eine
neue Baustein-Art erbt die Mehrsprachigkeit dadurch von selbst.

Bewusst **nicht** übersetzt: die Anschrift (»Landhausstrasse 20 · 6340
Baar« bleibt dieselbe Anschrift), Pfade, Farben, Kennungen, Dateinamen.

## Nachführen

In der Redaktion unter **Sprachen**: Der Knopf «Jetzt übersetzen» führt
alles Offene nach. Beim **Veröffentlichen** geschieht dasselbe von selbst –
ein neuer Beitrag ist damit übersetzt, ohne dass jemand daran denken muss.

Von Hand auf der Kommandozeile:

```bash
npm run bauen          # schreibt fehlend.json
npm run uebersetzen    # führt nach; optional: -- fr it
npm run bauen          # bringt es auf die Seiten
```

### Welcher Dienst

Voreingestellt ist die Anthropic-API. Auf dem Server als Umgebungsvariable
setzen (in konsoleH bei der Node-Anwendung):

| Schlüssel | Wert |
| --- | --- |
| `ANTHROPIC_API_KEY` | der Schlüssel |
| `UEBERSETZER_MODELL` | optional, sonst `claude-opus-5-5` |
| `UEBERSETZER_AUFWAND` | optional, sonst `low` – Übersetzen ist keine Denkaufgabe |

Alternativ DeepL:

| Schlüssel | Wert |
| --- | --- |
| `UEBERSETZER` | `deepl` |
| `DEEPL_API_KEY` | der Schlüssel |

Ist **kein** Schlüssel gesetzt, wird nicht übersetzt – das Veröffentlichen
läuft trotzdem durch und die fehlenden Stellen bleiben deutsch. Eine
Webseite, die wegen einer fehlenden Übersetzung gar nicht aufgeschaltet
wird, wäre der schlechtere Tausch.

## Maschinelle Übersetzung ist ein Entwurf

Sie trifft den Ton eines Hauses nicht immer, und bei Fachbegriffen –
Sonderschule, Sehen Plus, Kostengutsprache – liegt sie manchmal daneben.
Unter **Sprachen → Durchsehen** steht links der deutsche Satz, rechts die
Übersetzung; was dort von Hand geändert wird, bleibt stehen und wird nicht
wieder überschrieben.

Vor dem Aufschalten sollte jemand mit der jeweiligen Sprache einmal über
die wichtigsten Seiten lesen.
