# Shop

Ein Shop ohne Konto und ohne Online-Zahlung: Ware wählen, Warenkorb,
Angaben eintragen, abschicken. Die Bestellung landet auf dem Server und
erscheint in der Redaktion.

```
quelle/produkte/*.md        ein Produkt je Datei
inhalt/shop.json            Versand, Abholung, Zahlungsarten
bestellungen/*.json         eingegangene Bestellungen (nie im Repository)
```

Seiten: `/shop/` (Übersicht mit Kategorienfilter), `/shop/<kennung>/`
(Produktseite), `/warenkorb/` (Korb und Kasse) – in allen vier Sprachen.

## Ein Produkt anlegen

In der Redaktion unter **Produkte**. Felder:

| Feld | Bedeutung |
| --- | --- |
| Name, Kurzbeschreibung | Kurzbeschreibung steht in der Übersicht unter dem Namen |
| Preis | in Franken, z. B. `24.50` |
| Kategorie | gruppiert den Filter im Shop |
| Ausführungen | durch Komma getrennt, z. B. «klein, mittel, gross» |
| Lagerbestand | **leer = unbegrenzt**, `0` = nicht lieferbar, sonst die Stückzahl |
| Entwurf | solange angekreuzt, sieht das Produkt niemand |

Der Lagerbestand wird beim Bestellen **nicht** heruntergezählt – er begrenzt
nur, wie viel jemand in den Korb legen kann. Wer den Bestand führen will,
trägt ihn nach dem Versand von Hand nach.

## Speichern ist nicht Veröffentlichen

Der häufigste Stolperstein: Wer den Haken bei «Entwurf» entfernt und
speichert, hat die **Datei** geändert – die **Webseite** noch nicht. Erst
«Veröffentlichen» baut die Seiten neu.

Damit das nicht wieder jemanden kostet, steht oben in der Redaktion neben
dem Knopf, ob etwas aussteht: «Änderungen noch nicht auf der Webseite»,
und der Knopf ist dann gelb umrandet. Der Server vergleicht dafür das Alter
der Inhaltsdateien mit dem der gebauten Startseite.

## Warum der Preis zweimal gerechnet wird

Der Warenkorb lebt im Browser und zeigt Preise aus `produkte.json`. Beim
Abschicken rechnet der **Server noch einmal**, aus den Produktdateien. Was
der Browser schickt, ist ein Wunsch, keine Rechnung.

Das ist nicht übervorsichtig, sondern die Grundregel jedes Shops: Alles,
was im Browser steht, kann jemand ändern. Geprüft mit einer Bestellung, die
`"preis": 0.01` mitschickte – verrechnet wurden die 24.50 aus der Datei.

Ebenso begrenzt der Server: höchstens 50 Positionen, 99 Stück je Position,
nie mehr als der Lagerbestand, keine Entwürfe, Pflichtfelder vorhanden,
E-Mail plausibel, Steuerzeichen raus. Und höchstens zwanzig Versuche je
Viertelstunde und Adresse.

## Es gibt keine automatische Bestätigungsmail

Der Server kann keine Post verschicken – dafür bräuchte es einen
Mailversand, der hier nicht eingerichtet ist. Die Kundin sieht nach dem
Abschicken ihre Bestellnummer, mehr nicht.

**Jemand muss darum in die Redaktion schauen.** Auf der Übersicht steht
ganz oben, wie viele Bestellungen den Stand «Neu» haben; die Zahl ist rot,
solange welche offen sind. Unter **Bestellungen** steht die ganze
Bestellung samt Adresse, und der Stand lässt sich auf Bezahlt, Versandt,
Abgeholt oder Storniert setzen.

Der Text auf der Kassenseite sagt das auch so: «Wir bestätigen Ihre
Bestellung von Hand per E-Mail.» Ein Versprechen, das die Software nicht
hält, wäre schlimmer als gar keines.

## Der Shop braucht Node

Bestellt wird über `/api/bestellung`, und die Stelle gibt es nur, solange
die Node-Anwendung die Webseite ausliefert. Liegt die Seite als blosse
Dateien beim Apache (Weg A in `docs/hetzner.md`), funktionieren Regal und
Warenkorb, das Abschicken aber nicht.

## Bestelldaten gehören nicht ins Repository

`bestellungen/` steht in der `.gitignore`. Die Dateien tragen Namen,
Adressen und E-Mail-Adressen; sie bleiben auf dem Server. Wer sie sichert,
sichert Personendaten – entsprechend aufbewahren und aufräumen.

## Was noch fehlt

- **Online-Zahlung.** Vorgesehen ist Stripe (siehe `docs/sprachen.md` für
  das Muster: eine Adresse in den Einstellungen schaltet es scharf).
  Zurzeit gibt es Rechnung und Zahlung bei Abholung.
- **Lagerführung**, siehe oben.
- **Versandkosten nach Gewicht oder Land** – zurzeit eine Pauschale mit
  einer Freigrenze.
