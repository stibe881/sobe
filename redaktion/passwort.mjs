// Legt das Redaktions-Passwort an oder ändert es:
//   node redaktion/passwort.mjs
import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abdruck, zugangLesen, zugangSchreiben } from './zugang.mjs';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const frage = createInterface({ input: process.stdin, output: process.stdout });

const passwort = await frage.question('Neues Passwort für die Redaktion: ');
frage.close();

if (passwort.length < 12) {
  console.error('Zu kurz – mindestens zwölf Zeichen. Nichts geändert.');
  process.exit(1);
}

const alt = await zugangLesen(WURZEL);
await zugangSchreiben(WURZEL, {
  passwort: abdruck(passwort),
  geheimnis: alt?.geheimnis || randomBytes(32).toString('hex'),
});
console.log('Passwort gesetzt. Die Datei redaktion/zugang.json gehört nicht ins Repository.');
