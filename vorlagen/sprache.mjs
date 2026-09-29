// Mehrsprachigkeit.
//
// Grundsatz: Deutsch ist die Quelle, alles andere ist Übersetzung davon.
// Der Schlüssel im Wortschatz ist der deutsche Text selbst – nicht eine
// erfundene Kennung. Das hat einen Preis (ändert sich der deutsche Satz,
// ist die Übersetzung weg) und einen grossen Vorteil: Fehlt eine
// Übersetzung, steht dort der richtige deutsche Satz statt «seite.titel.3».
// Für ein Haus, das seine Webseite selbst pflegt, wiegt das schwerer.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export async function sprachenLesen(wurzel) {
  return JSON.parse(await readFile(path.join(wurzel, 'inhalt/sprachen.json'), 'utf8'));
}

const wortschatzOrt = (wurzel, kennung) =>
  path.join(wurzel, 'inhalt/uebersetzungen', `${kennung}.json`);

export async function wortschatzLesen(wurzel, kennung) {
  const ort = wortschatzOrt(wurzel, kennung);
  if (!existsSync(ort)) return {};
  try { return JSON.parse(await readFile(ort, 'utf8')); } catch { return {}; }
}

export async function wortschatzSchreiben(wurzel, kennung, wortschatz) {
  await mkdir(path.join(wurzel, 'inhalt/uebersetzungen'), { recursive: true });
  // Sortiert schreiben: Sonst hängt die Reihenfolge daran, in welcher der
  // Bau die Sätze zuerst gesehen hat, und jeder Lauf erzeugt einen anderen
  // Unterschied, ohne dass sich etwas geändert hätte.
  const sortiert = {};
  for (const schluessel of Object.keys(wortschatz).sort()) sortiert[schluessel] = wortschatz[schluessel];
  await writeFile(wortschatzOrt(wurzel, kennung), JSON.stringify(sortiert, null, 2) + '\n', 'utf8');
}

/* Baut die Übersetzungsfunktion für eine Sprache. Fehlende Sätze landen in
   «fehlend» – daraus weiss das Übersetzungswerkzeug später, was zu tun ist. */
export function uebersetzerBauen(sprache, wortschatz, fehlend) {
  if (sprache.standard) {
    const t = (text) => (text == null ? text : String(text));
    t.sprache = sprache;
    return t;
  }
  const t = (text) => {
    if (text == null) return text;
    const quelle = String(text);
    if (!quelle.trim()) return quelle;
    const treffer = wortschatz[quelle];
    if (treffer) return treffer;
    if (fehlend) fehlend.add(quelle);
    return quelle;               // lieber Deutsch als Leere
  };
  t.sprache = sprache;
  return t;
}

export function datumLang(iso, sprache) {
  if (!iso) return '';
  const [j, m, tag] = String(iso).slice(0, 10).split('-').map(Number);
  if (!j || !m || !tag) return String(iso);
  return new Intl.DateTimeFormat(sprache?.gebietsschema || 'de-CH', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(j, m - 1, tag)));
}

/* --------------------------------------------------------------- Pfade */

// Was nicht in die Webseite zeigt, bleibt unangetastet.
const fremd = (pfad) => /^(https?:|mailto:|tel:|data:|#)/i.test(pfad);

export function pfadFuer(pfad, sprache) {
  if (!pfad || typeof pfad !== 'string' || fremd(pfad)) return pfad;
  if (sprache.standard || pfad.charAt(0) !== '/') return pfad;
  // Bilder und Dateien liegen nur einmal da, nicht je Sprache.
  if (/^\/(bilder|dateien|wp-content)\//.test(pfad)) return pfad;
  if (/\.(css|js|json|txt|xml|png|jpe?g|webp|svg|pdf|ico)$/i.test(pfad)) return pfad;
  return sprache.wurzel.replace(/\/$/, '') + pfad;
}

/* ------------------------------------------------- Inhalte übersetzen

   Statt jede Vorlage anzufassen wird der Inhalt vor dem Zeichnen
   übersetzt: Die Bausteine bleiben, wie sie sind, und eine neue
   Baustein-Art erbt die Mehrsprachigkeit von selbst.

   Welche Schlüssel Text tragen, steht hier – bewusst als Liste und nicht
   als «alles, was eine Zeichenkette ist». Sonst gerieten Pfade, Farben und
   Kennungen in den Wortschatz und würden übersetzt. */
const TEXTFELDER = new Set([
  'titel', 'text', 'marke', 'alt', 'hinweis', 'beschreibung', 'untertitel',
  'name', 'funktion', 'pensum', 'eintritt', 'bereich', 'bildAlt', 'rumpf',
  'html',
  // 'adresse' bewusst nicht: «Landhausstrasse 20 · 6340 Baar» bleibt in
  // jeder Sprache dieselbe Anschrift.
]);
const TEXTLISTEN = new Set(['absaetze']);
const PFADFELDER = new Set(['pfad', 'ziel', 'markeZiel', 'bewerbungslink']);

export function inhaltUebersetzen(wert, t, sprache) {
  if (Array.isArray(wert)) return wert.map((x) => inhaltUebersetzen(x, t, sprache));
  if (wert === null || typeof wert !== 'object') return wert;
  const raus = {};
  for (const [schluessel, inhalt] of Object.entries(wert)) {
    if (TEXTFELDER.has(schluessel) && typeof inhalt === 'string') raus[schluessel] = t(inhalt);
    else if (TEXTLISTEN.has(schluessel) && Array.isArray(inhalt)) raus[schluessel] = inhalt.map((x) => t(x));
    else if (PFADFELDER.has(schluessel) && typeof inhalt === 'string') raus[schluessel] = pfadFuer(inhalt, sprache);
    else raus[schluessel] = inhaltUebersetzen(inhalt, t, sprache);
  }
  return raus;
}
