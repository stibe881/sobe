// Füllt die fehlenden Übersetzungen auf.
//
// Ablauf:  bauen()  →  inhalt/uebersetzungen/fehlend.json  →  dieses Werkzeug
//          →  inhalt/uebersetzungen/<sprache>.json  →  bauen()
//
// Aufruf:  npm run uebersetzen            (alle Sprachen)
//          npm run uebersetzen -- fr it   (nur diese)
//
// Warum rohes HTTP statt des offiziellen SDK: Dieses Projekt hat mit Absicht
// keine Abhängigkeiten – auf dem Webhosting soll beim Bauen nichts
// nachgeladen werden. fetch bringt Node selbst mit.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sprachenLesen, wortschatzLesen, wortschatzSchreiben } from '../vorlagen/sprache.mjs';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const MODELL = process.env.UEBERSETZER_MODELL || 'claude-opus-5-5';
const ADRESSE = process.env.ANTHROPIC_ADRESSE || 'https://api.anthropic.com';
const DEEPL_ADRESSE = process.env.DEEPL_ADRESSE || 'https://api-free.deepl.com';

// Wie viele Zeichen höchstens in einer Anfrage stecken. Ein ganzer
// Beitragstext kann allein darüber liegen – dann geht er eben allein.
const BUENDELGROESSE = 4000;

function buendeln(saetze) {
  const buendel = [];
  let jetzt = [];
  let laenge = 0;
  for (const satz of saetze) {
    if (jetzt.length && laenge + satz.length > BUENDELGROESSE) {
      buendel.push(jetzt);
      jetzt = [];
      laenge = 0;
    }
    jetzt.push(satz);
    laenge += satz.length;
  }
  if (jetzt.length) buendel.push(jetzt);
  return buendel;
}

const NAME = { fr: 'Französisch', it: 'Italienisch', en: 'Englisch' };
const DEEPL_ZIEL = { fr: 'FR', it: 'IT', en: 'EN-GB' };

function anweisung(sprache) {
  return [
    `Du übersetzt die Webseite des SONNENBERG in Baar (Schweiz) aus dem Deutschen ins ${NAME[sprache.kennung] || sprache.name}.`,
    '',
    'Regeln:',
    '- Übersetze genau den gegebenen Text, nichts hinzufügen, nichts weglassen.',
    '- HTML-Auszeichnungen und Markdown bleiben unverändert stehen, samt Attributen.',
    '- Eigennamen bleiben: SONNENBERG, Baar, Zug, Landhausstrasse, Namen von Personen.',
    '- Schweizer Verhältnisse: Kanton, Gemeinde, Logopädie, Internat, Sonderschule.',
    '- Höflichkeitsform durchgehend (vous / Lei / you), wie im Deutschen das «Sie».',
    '- Ist ein Eintrag bereits in der Zielsprache oder ein blosser Eigenname, gib ihn unverändert zurück.',
    '- Stimmt etwas nicht (leerer Text), gib den Text unverändert zurück.',
  ].join('\n');
}

const SCHEMA = {
  type: 'object',
  properties: {
    uebersetzungen: {
      type: 'array',
      items: {
        type: 'object',
        properties: { nummer: { type: 'integer' }, text: { type: 'string' } },
        required: ['nummer', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['uebersetzungen'],
  additionalProperties: false,
};

async function mitWiederholung(tun, versuche = 4) {
  let letzter;
  for (let i = 0; i < versuche; i++) {
    try { return await tun(); } catch (fehler) {
      letzter = fehler;
      // 429 und 5xx sind vorübergehend; alles andere hat keinen Zweck.
      if (!/\b(429|5\d\d)\b/.test(String(fehler.message))) throw fehler;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
  throw letzter;
}

async function mitClaude(saetze, sprache) {
  const schluessel = process.env.ANTHROPIC_API_KEY;
  if (!schluessel) throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt.');
  const liste = saetze.map((s, i) => ({ nummer: i + 1, text: s }));

  const antwort = await fetch(`${ADRESSE}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': schluessel,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELL,
      max_tokens: 16000,
      system: anweisung(sprache),
      // Übersetzen ist keine Denkaufgabe – niedriger Aufwand genügt und
      // kostet einen Bruchteil. Über UEBERSETZER_AUFWAND änderbar.
      output_config: {
        effort: process.env.UEBERSETZER_AUFWAND || 'low',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      messages: [{
        role: 'user',
        content: 'Übersetze jeden Eintrag. Gib zu jeder Nummer den übersetzten Text zurück.\n\n'
          + JSON.stringify(liste, null, 1),
      }],
    }),
  });

  if (!antwort.ok) {
    throw new Error(`Anthropic antwortet mit ${antwort.status}: ${(await antwort.text()).slice(0, 300)}`);
  }
  const ergebnis = await antwort.json();
  if (ergebnis.stop_reason === 'refusal') {
    throw new Error('Die Anfrage wurde abgelehnt: ' + (ergebnis.stop_details?.explanation || ''));
  }
  const text = (ergebnis.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const daten = JSON.parse(text);
  const raus = new Map();
  for (const eintrag of daten.uebersetzungen || []) {
    const quelle = saetze[eintrag.nummer - 1];
    if (quelle != null && eintrag.text) raus.set(quelle, eintrag.text);
  }
  return raus;
}

async function mitDeepl(saetze, sprache) {
  const schluessel = process.env.DEEPL_API_KEY;
  if (!schluessel) throw new Error('DEEPL_API_KEY ist nicht gesetzt.');
  const antwort = await fetch(`${DEEPL_ADRESSE}/v2/translate`, {
    method: 'POST',
    headers: { authorization: `DeepL-Auth-Key ${schluessel}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: saetze, source_lang: 'DE', target_lang: DEEPL_ZIEL[sprache.kennung] || sprache.kennung.toUpperCase(),
      tag_handling: 'html', formality: 'prefer_more',
    }),
  });
  if (!antwort.ok) {
    throw new Error(`DeepL antwortet mit ${antwort.status}: ${(await antwort.text()).slice(0, 300)}`);
  }
  const ergebnis = await antwort.json();
  const raus = new Map();
  (ergebnis.translations || []).forEach((u, i) => {
    if (u.text) raus.set(saetze[i], u.text);
  });
  return raus;
}

const dienste = { anthropic: mitClaude, deepl: mitDeepl };

export async function fehlendeUebersetzen(wurzel = WURZEL, { nur = [], melden = () => {} } = {}) {
  const ort = path.join(wurzel, 'inhalt/uebersetzungen/fehlend.json');
  if (!existsSync(ort)) throw new Error('fehlend.json fehlt – zuerst «npm run bauen».');
  const fehlend = JSON.parse(await readFile(ort, 'utf8'));
  const sprachen = await sprachenLesen(wurzel);
  const dienstName = process.env.UEBERSETZER || 'anthropic';
  const dienst = dienste[dienstName];
  if (!dienst) throw new Error(`Unbekannter Übersetzer «${dienstName}». Möglich: ${Object.keys(dienste).join(', ')}`);

  const bilanz = {};
  for (const sprache of sprachen) {
    if (sprache.standard) continue;
    if (nur.length && !nur.includes(sprache.kennung)) continue;
    const offen = fehlend[sprache.kennung] || [];
    if (!offen.length) continue;

    const wortschatz = await wortschatzLesen(wurzel, sprache.kennung);
    const buendel = buendeln(offen);
    let fertig = 0;
    for (let i = 0; i < buendel.length; i++) {
      melden(`${sprache.kennung}: Bündel ${i + 1} von ${buendel.length} (${buendel[i].length} Einträge)`);
      const uebersetzt = await mitWiederholung(() => dienst(buendel[i], sprache));
      for (const [quelle, ziel] of uebersetzt) { wortschatz[quelle] = ziel; fertig++; }
      // Nach jedem Bündel schreiben: Bricht der Lauf ab, ist die Arbeit
      // bis dahin nicht verloren und der nächste Lauf macht dort weiter.
      await wortschatzSchreiben(wurzel, sprache.kennung, wortschatz);
    }
    bilanz[sprache.kennung] = { offen: offen.length, uebersetzt: fertig };
  }
  return bilanz;
}

const direkt = process.argv[1] && process.argv[1].endsWith('uebersetzen.mjs');
if (direkt) {
  const nur = process.argv.slice(2).filter((a) => /^[a-z]{2}$/.test(a));
  fehlendeUebersetzen(WURZEL, { nur, melden: (s) => console.log('  ' + s) })
    .then((bilanz) => {
      const zeilen = Object.entries(bilanz)
        .map(([k, v]) => `${k}: ${v.uebersetzt} von ${v.offen}`);
      console.log(zeilen.length ? zeilen.join(', ') : 'Nichts offen.');
      console.log('Jetzt «npm run bauen», damit es auf die Seiten kommt.');
    })
    .catch((fehler) => { console.error('Fehlgeschlagen:', fehler.message); process.exit(1); });
}
