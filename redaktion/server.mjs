// Redaktionssystem des SONNENBERG – läuft auf dem eigenen Webhosting.
//
// Bewusst ohne Fremdpakete: Node bringt alles mit, was dieser Server braucht.
// Die Oberfläche spricht dieselbe Schnittstelle, die früher zur GitHub-API
// ging (/api/contents/…) – darum ist die ganze Redaktionslogik unverändert
// geblieben, getauscht wurde nur der Unterbau.
//
// Aufruf:  node redaktion/server.mjs        (Port 3000, oder PORT=…)
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, unlink, mkdir, stat, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bauen } from '../bauen.mjs';
import { fehlendeUebersetzen } from '../werkzeuge/uebersetzen.mjs';
import {
  zugangLesen, stimmt, sitzungAusstellen, sitzungGueltig,
  gesperrt, fehlversuchZaehlen, fehlversucheLoeschen,
} from './zugang.mjs';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);
const GROESSTE_ANFRAGE = 12 * 1024 * 1024;

// Beschreibbar ist nur, was die Redaktion pflegt – der Rest des Repositories
// bleibt für diesen Server unerreichbar.
// Was die Redaktion ändern darf. Alles andere – Vorlagen, Skripte, der
// Server selbst – bleibt dem Repository vorbehalten: Ein Redaktionssystem,
// das seinen eigenen Code überschreiben kann, ist kein Redaktionssystem
// mehr, sondern eine offene Tür.
const SCHREIBBAR = [
  'quelle/',                        // Beiträge, Stellen, Team, Textbausteine
  'inhalt/',                        // feste Seiten, Menü, Einstellungen
  'bilder/',                        // Bildbestand der Webseite
  'statisch/wp-content/uploads/',   // übernommene und neu geladene Bilder
];

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};

const abdruck = (inhalt) => createHash('sha256').update(inhalt).digest('hex');

function imBaum(pfad) {
  const voll = path.resolve(WURZEL, pfad);
  return voll.startsWith(WURZEL + path.sep) ? voll : null;
}

const darfSchreiben = (pfad) =>
  SCHREIBBAR.some((erlaubt) => pfad.startsWith(erlaubt)) && !pfad.includes('..');

const antwort = (res, status, daten) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(daten));
};

function plaetzchen(req, name) {
  for (const teil of (req.headers.cookie || '').split(';')) {
    const [k, ...rest] = teil.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

async function koerper(req) {
  let laenge = 0;
  const stuecke = [];
  for await (const stueck of req) {
    laenge += stueck.length;
    if (laenge > GROESSTE_ANFRAGE) throw new Error('Anfrage zu gross');
    stuecke.push(stueck);
  }
  if (!stuecke.length) return {};
  return JSON.parse(Buffer.concat(stuecke).toString('utf8'));
}

// Gleicht zwei Ordner ab, ohne fremde Werkzeuge: kopiert Neues und
// Geändertes, entfernt, was in der Quelle nicht mehr vorkommt. Kein rsync –
// auf geteiltem Webhosting ist nicht gesagt, dass es vorhanden ist.
async function abgleichen(quelle, ziel) {
  await mkdir(ziel, { recursive: true });
  const hier = await readdir(quelle, { withFileTypes: true });
  const gewollt = new Set(hier.map((e) => e.name));

  for (const eintrag of hier) {
    const von = path.join(quelle, eintrag.name);
    const nach = path.join(ziel, eintrag.name);
    if (eintrag.isDirectory()) {
      await abgleichen(von, nach);
      continue;
    }
    let gleich = false;
    try {
      const [a, b] = await Promise.all([stat(von), stat(nach)]);
      gleich = a.size === b.size && a.mtimeMs <= b.mtimeMs;
    } catch { /* Ziel fehlt noch */ }
    if (!gleich) await copyFile(von, nach);
  }

  for (const eintrag of await readdir(ziel, { withFileTypes: true })) {
    if (gewollt.has(eintrag.name)) continue;
    // Was die Redaktion nicht hingelegt hat, bleibt unangetastet: eine
    // .htaccess von Hand soll ein Veröffentlichen nicht wegräumen.
    if (eintrag.name.startsWith('.')) continue;
    await rm(path.join(ziel, eintrag.name), { recursive: true, force: true });
  }
}

async function dateiAusliefern(res, datei) {
  if (!existsSync(datei)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Nicht gefunden'); }
  const angaben = await stat(datei);
  if (angaben.isDirectory()) return dateiAusliefern(res, path.join(datei, 'index.html'));
  res.writeHead(200, { 'content-type': TYPEN[path.extname(datei).toLowerCase()] || 'application/octet-stream' });
  res.end(await readFile(datei));
}

const GESTARTET = new Date().toISOString();

// Ein Übersetzer gilt als eingerichtet, sobald ein Schlüssel dasteht.
const uebersetzerBereit = () =>
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.DEEPL_API_KEY);

async function uebersetzungslauf() {
  await bauen();                       // damit fehlend.json aktuell ist
  const bilanz = await fehlendeUebersetzen(WURZEL);
  await bauen();                       // damit das Übersetzte in den Seiten steht
  return bilanz;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pfad = decodeURIComponent(url.pathname);
    const zugang = await zugangLesen(WURZEL);

    if (!zugang) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Kein Zugang eingerichtet. Zuerst auf dem Server: node redaktion/passwort.mjs');
    }

    const angemeldet = sitzungGueltig(plaetzchen(req, 'redaktion'), zugang.geheimnis);
    const eigeneAnfrage = req.headers['x-redaktion'] === 'ja';

    // ------------------------------------------------------------- Anmeldung
    if (pfad === '/api/anmelden' && req.method === 'POST') {
      const kennzeichen = req.socket.remoteAddress || 'unbekannt';
      if (gesperrt(kennzeichen)) return antwort(res, 429, { fehler: 'Zu viele Versuche. Bitte in einer Viertelstunde erneut.' });
      const { passwort } = await koerper(req);
      if (!passwort || !stimmt(passwort, zugang.passwort)) {
        fehlversuchZaehlen(kennzeichen);
        return antwort(res, 401, { fehler: 'Passwort stimmt nicht.' });
      }
      fehlversucheLoeschen(kennzeichen);
      const sicher = req.headers['x-forwarded-proto'] === 'https';
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'set-cookie': `redaktion=${sitzungAusstellen(zugang.geheimnis)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${sicher ? '; Secure' : ''}`,
      });
      return res.end(JSON.stringify({ gut: true }));
    }

    if (pfad === '/api/abmelden' && req.method === 'POST') {
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'set-cookie': 'redaktion=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
      });
      return res.end(JSON.stringify({ gut: true }));
    }

    // ------------------------------------------------------------ Auskunft
    //
    // Sagt, welcher Stand gerade läuft. Node lädt die Dateien beim Start
    // einmal und behält sie im Speicher: Ein Pull ohne Neustart ändert
    // nichts, sieht aber von aussen genauso aus wie ein misslungener Pull.
    // Dieses Fenster unterscheidet die beiden Fälle ohne Screenshots.
    if (pfad === '/api/stand') {
      let stand = 'unbekannt';
      try {
        const kopf = (await readFile(path.join(WURZEL, '.git/HEAD'), 'utf8')).trim();
        const zeiger = kopf.startsWith('ref: ') ? kopf.slice(5) : null;
        stand = zeiger
          ? (await readFile(path.join(WURZEL, '.git', zeiger), 'utf8')).trim().slice(0, 7)
          : kopf.slice(0, 7);
      } catch { /* kein Klon – dann bleibt es bei «unbekannt» */ }
      return antwort(res, 200, {
        stand,
        gestartet: GESTARTET,
        wurzel: 'Webseite',          // seit der Trennung: / ist die Webseite
        oeffentlich: process.env.OEFFENTLICH || null,
      });
    }

    // ------------------------------------------------------------ Oberfläche
    //
    // Die Redaktion liegt unter /redaktion/, nicht an der Wurzel: Wird Node
    // für eine Domain aktiviert, bekommt diese Anwendung deren sämtliche
    // Anfragen – die Wurzel gehört dann der Webseite, nicht dem Backend.
    if (pfad === '/redaktion' || pfad === '/redaktion/') {
      if (pfad === '/redaktion') {
        res.writeHead(301, { location: '/redaktion/' });
        return res.end();
      }
      return dateiAusliefern(res, path.join(WURZEL, 'redaktion/oberflaeche.html'));
    }
    // Stil und Skript der Oberfläche. Nur diese beiden – der Ordner enthält
    // auch zugang.json mit dem Passwort-Abdruck, und ein offener Ordner
    // hätte die früher oder später mitgeliefert.
    if (pfad === '/redaktion/stil.css' || pfad === '/redaktion/oberflaeche.js') {
      return dateiAusliefern(res, path.join(WURZEL, pfad.slice('/redaktion/'.length)
        .replace(/^/, 'redaktion/')));
    }

    // --------------------------------------------------------------- Dateien
    if (pfad.startsWith('/api/contents/') || pfad === '/api/contents') {
      if (!angemeldet) return antwort(res, 401, { fehler: 'Nicht angemeldet.' });
      if (req.method !== 'GET' && !eigeneAnfrage) return antwort(res, 403, { fehler: 'Ungültige Anfrage.' });

      const teil = pfad.slice('/api/contents/'.length);
      const voll = imBaum(teil);
      if (!voll) return antwort(res, 400, { fehler: 'Ungültiger Pfad.' });

      if (req.method === 'GET') {
        if (!existsSync(voll)) return antwort(res, 404, { fehler: 'Nicht gefunden.' });
        const angaben = await stat(voll);
        if (angaben.isDirectory()) {
          const namen = await readdir(voll);
          const eintraege = await Promise.all(namen.filter((n) => !n.startsWith('.')).map(async (n) => {
            const kind = await stat(path.join(voll, n));
            return { name: n, path: `${teil}/${n}`, type: kind.isDirectory() ? 'dir' : 'file' };
          }));
          return antwort(res, 200, eintraege);
        }
        const roh = await readFile(voll);
        return antwort(res, 200, {
          name: path.basename(voll), path: teil,
          sha: abdruck(roh), content: roh.toString('base64'), encoding: 'base64',
        });
      }

      if (!darfSchreiben(teil)) return antwort(res, 403, { fehler: 'Dieser Ort ist für die Redaktion gesperrt.' });

      if (req.method === 'PUT') {
        const { content, sha } = await koerper(req);
        // Denselben Schutz wie GitHub: Wer eine veraltete Fassung schickt,
        // überschreibt nicht stillschweigend die Arbeit einer anderen Person.
        if (existsSync(voll)) {
          const jetzt = abdruck(await readFile(voll));
          if (sha && sha !== jetzt) {
            return antwort(res, 409, { fehler: 'Die Datei wurde zwischenzeitlich geändert. Bitte neu laden.' });
          }
        }
        const roh = Buffer.from(String(content), 'base64');
        await mkdir(path.dirname(voll), { recursive: true });
        await writeFile(voll, roh);
        return antwort(res, 200, { content: { name: path.basename(voll), path: teil, sha: abdruck(roh) } });
      }

      if (req.method === 'DELETE') {
        if (existsSync(voll)) await unlink(voll);
        return antwort(res, 200, { gut: true });
      }
      return antwort(res, 405, { fehler: 'Nicht erlaubt.' });
    }

    // ------------------------------------------------------------ Übersetzen
    //
    // Getrennt vom Veröffentlichen, damit man auch ohne Aufschalten
    // nachführen kann. Beide Wege rufen dieselbe Kette: bauen, damit die
    // Liste der fehlenden Sätze stimmt – übersetzen – nochmals bauen.
    if (pfad === '/api/uebersetzen' && req.method === 'POST') {
      if (!angemeldet) return antwort(res, 401, { fehler: 'Nicht angemeldet.' });
      if (!eigeneAnfrage) return antwort(res, 403, { fehler: 'Ungültige Anfrage.' });
      try {
        const bilanz = await uebersetzungslauf();
        return antwort(res, 200, { gut: true, bilanz });
      } catch (fehler) {
        return antwort(res, 500, { fehler: fehler.message });
      }
    }

    // --------------------------------------------------------- Veröffentlichen
    if (pfad === '/api/veroeffentlichen' && req.method === 'POST') {
      if (!angemeldet) return antwort(res, 401, { fehler: 'Nicht angemeldet.' });
      if (!eigeneAnfrage) return antwort(res, 403, { fehler: 'Ungültige Anfrage.' });
      const schritte = [];
      try {
        let anzahl = await bauen();
        schritte.push(`${anzahl} Seiten gebaut`);
        // Neue Einträge sollen übersetzt aufgeschaltet werden, ohne dass
        // jemand daran denken muss. Schlägt es fehl – kein Schlüssel, kein
        // Netz –, geht die Lieferung trotzdem raus: Dann steht dort Deutsch,
        // und das ist besser als eine Webseite, die nicht aufgeschaltet wird.
        if (uebersetzerBereit()) {
          try {
            const bilanz = await uebersetzungslauf();
            const zahl = Object.values(bilanz).reduce((s, b) => s + b.uebersetzt, 0);
            schritte.push(zahl ? `${zahl} Sätze übersetzt` : 'nichts zu übersetzen');
            anzahl = await bauen();
          } catch (fehler) {
            schritte.push(`Übersetzen fehlgeschlagen (${fehler.message}) – Deutsch bleibt stehen`);
          }
        } else {
          schritte.push('kein Übersetzer eingerichtet');
        }
        const ziel = process.env.OEFFENTLICH;
        if (ziel) {
          await abgleichen(path.join(WURZEL, 'statisch'), ziel);
          schritte.push('aufgeschaltet');
        } else {
          schritte.push('nicht aufgeschaltet (OEFFENTLICH nicht gesetzt)');
        }
        return antwort(res, 200, { gut: true, schritte, zeitpunkt: new Date().toISOString() });
      } catch (fehler) {
        return antwort(res, 500, { fehler: fehler.message, schritte });
      }
    }

    // ---------------------------------------- Vorschau der gebauten Webseite
    const ziel = imBaum(path.join('statisch', pfad));
    if (!ziel) { res.writeHead(400); return res.end('Ungültiger Pfad'); }
    return dateiAusliefern(res, ziel);
  } catch (fehler) {
    console.error(fehler);
    if (!res.headersSent) antwort(res, 500, { fehler: 'Serverfehler.' });
    else res.end();
  }
});

server.listen(PORT, () => console.log(`Redaktion läuft auf http://127.0.0.1:${PORT}`));
