// Anmeldung und Sitzungen – mit Bordmitteln von Node.
//
// Das Passwort liegt nie im Klartext: gespeichert wird ein scrypt-Abdruck mit
// eigenem Salz. Die Sitzung ist ein signiertes Plätzchen (HMAC), kein Speicher
// im Server – so übersteht die Anmeldung auch einen Neustart der App.
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SITZUNG_DAUER = 8 * 60 * 60 * 1000; // acht Stunden

export function abdruck(passwort, salz = randomBytes(16).toString('hex')) {
  return `${salz}:${scryptSync(passwort, salz, 64).toString('hex')}`;
}

export function stimmt(passwort, gespeichert) {
  const [salz, erwartet] = String(gespeichert).split(':');
  if (!salz || !erwartet) return false;
  const geprueft = scryptSync(passwort, salz, 64);
  const soll = Buffer.from(erwartet, 'hex');
  return geprueft.length === soll.length && timingSafeEqual(geprueft, soll);
}

export async function zugangLesen(wurzel) {
  const datei = path.join(wurzel, 'redaktion', 'zugang.json');
  if (!existsSync(datei)) return null;
  return JSON.parse(await readFile(datei, 'utf8'));
}

export async function zugangSchreiben(wurzel, daten) {
  const datei = path.join(wurzel, 'redaktion', 'zugang.json');
  await writeFile(datei, JSON.stringify(daten, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
}

export function sitzungAusstellen(geheimnis) {
  const bis = Date.now() + SITZUNG_DAUER;
  const unterschrift = createHmac('sha256', geheimnis).update(String(bis)).digest('hex');
  return `${bis}.${unterschrift}`;
}

export function sitzungGueltig(wert, geheimnis) {
  if (!wert) return false;
  const [bis, unterschrift] = String(wert).split('.');
  if (!bis || !unterschrift || Number(bis) < Date.now()) return false;
  const soll = createHmac('sha256', geheimnis).update(bis).digest('hex');
  const a = Buffer.from(unterschrift, 'hex');
  const b = Buffer.from(soll, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

// Ein einfacher Riegel gegen Durchprobieren: nach fünf Fehlversuchen ist für
// fünfzehn Minuten Ruhe. Absichtlich nur im Arbeitsspeicher – bei einem
// Neustart der App ist der Zähler zurück, das genügt für ein Redaktionssystem
// mit einer Handvoll Anmeldungen pro Woche.
const fehlversuche = new Map();

export function gesperrt(kennzeichen) {
  const eintrag = fehlversuche.get(kennzeichen);
  return Boolean(eintrag && eintrag.anzahl >= 5 && Date.now() < eintrag.bis);
}

export function fehlversuchZaehlen(kennzeichen) {
  const eintrag = fehlversuche.get(kennzeichen) || { anzahl: 0, bis: 0 };
  eintrag.anzahl += 1;
  eintrag.bis = Date.now() + 15 * 60 * 1000;
  fehlversuche.set(kennzeichen, eintrag);
}

export function fehlversucheLoeschen(kennzeichen) {
  fehlversuche.delete(kennzeichen);
}
