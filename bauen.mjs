// Baut aus inhalt/ (feste Seiten) und quelle/ (redaktionelle Inhalte) die
// fertige Webseite nach statisch/ – im Auftritt «Mosaik».
//
// Ohne Fremdpakete, damit auf dem Webhosting nichts nachgeladen werden muss.
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baustein, schuetzen, datumLang } from './vorlagen/bausteine.mjs';
import { sammlungLesen, markdownZuHtml, wordpressAufraeumen } from './vorlagen/inhalte.mjs';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const AUS = path.join(WURZEL, 'statisch');

const lesen = async (p) => JSON.parse(await readFile(path.join(WURZEL, p), 'utf8'));

function huelle({ titel, beschreibung, pfad, inhalt, einstellungen }) {
  const menue = einstellungen.menue.map((m) => {
    const aktiv = m.pfad === pfad || (m.pfad !== '/' && pfad.startsWith(m.pfad));
    return `      <a href="${schuetzen(m.pfad)}"${aktiv ? ' aria-current="page"' : ''}>${schuetzen(m.titel)}</a>`;
  }).join('\n');

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${schuetzen(titel)} · ${schuetzen(einstellungen.name)}</title>
<meta name="description" content="${schuetzen(beschreibung)}">
<link rel="stylesheet" href="/stil.css">
</head>
<body>
<a class="springen" href="#inhalt">Zum Inhalt springen</a>

<header class="kopf">
  <div class="kopfband">
    <a href="/" aria-label="${schuetzen(einstellungen.name)}, zur Startseite"><img src="/bilder/logo.png" alt="${schuetzen(einstellungen.name)}"></a>
    <button id="burger" class="burger" aria-expanded="false" aria-controls="menue" aria-label="Menü">☰</button>
    <nav id="menue" class="menue" aria-label="Hauptnavigation">
${menue}
      <a class="knopf gelb" href="${schuetzen(einstellungen.menueKnopf.pfad)}">${schuetzen(einstellungen.menueKnopf.titel)}</a>
    </nav>
  </div>
</header>

<main id="inhalt">
  <div class="raster">
${inhalt}
    <div class="kachel nacht fussk">
      <img src="/bilder/logo-weiss.png" alt="${schuetzen(einstellungen.name)}">
      <div>${schuetzen(einstellungen.adresse)} · <a class="hell" href="tel:${schuetzen(einstellungen.telefonWahl)}">${schuetzen(einstellungen.telefon)}</a></div>
      <div class="rechts">${einstellungen.fusszeile.map((f) => `<a href="${schuetzen(f.pfad)}">${schuetzen(f.titel)}</a>`).join('')}</div>
    </div>
  </div>
</main>

<script src="/seite.js" defer></script>
</body>
</html>
`;
}

async function schreiben(pfad, html) {
  const ziel = path.join(AUS, pfad === '/' ? '' : pfad, 'index.html');
  await mkdir(path.dirname(ziel), { recursive: true });
  await writeFile(ziel, html, 'utf8');
}

export async function bauen() {
  const einstellungen = await lesen('inhalt/einstellungen.json');
  const seiten = await lesen('inhalt/seiten.json');

  const beitraege = (await sammlungLesen(WURZEL, 'news'))
    .sort((a, b) => String(b.datum || '').localeCompare(String(a.datum || '')));
  const stellen = (await sammlungLesen(WURZEL, 'stellen'))
    .sort((a, b) => a.reihenfolge - b.reihenfolge);
  const team = (await sammlungLesen(WURZEL, 'team'))
    .sort((a, b) => a.reihenfolge - b.reihenfolge);

  const hilfe = { einstellungen, beitraege, stellen, team };

  // Nur die erzeugten Teile räumen – der Bestand bleibt liegen.
  for (const eintrag of existsSync(AUS) ? await readdir(AUS) : []) {
    if (eintrag === 'wp-content') continue;
    await rm(path.join(AUS, eintrag), { recursive: true, force: true });
  }
  await mkdir(AUS, { recursive: true });

  for (const s of seiten) {
    const inhalt = s.bausteine.map((b) => '    ' + baustein(b, hilfe)).join('\n');
    await schreiben(s.pfad, huelle({ ...s, inhalt, einstellungen }));
  }

  // ------------------------------------------------------------- Beiträge
  for (const p of beitraege) {
    const rumpf = p.markdown ? markdownZuHtml(p.rumpf) : wordpressAufraeumen(p.rumpf);
    const teile = [];
    if (p.bild) teile.push({ art: 'bild', spalten: 6, quelle: p.bild, alt: p.bildAlt || '' });
    teile.push({ art: 'rohtext', spalten: 4, marke: `Aktuell · ${datumLang(p.datum)}`,
      titel: p.titel, html: rumpf || '<p>Dieser Beitrag hat noch keinen Text.</p>' });
    const weitere = beitraege.filter((x) => x.kennung !== p.kennung).slice(0, 3);
    teile.push({ art: 'kachel', spalten: 2, farbe: 'gelb', titel: 'Weitere Beiträge',
      links: weitere.map((x) => ({ titel: x.titel, pfad: `/aktuell/${x.kennung}/` })) });
    const inhalt = teile.map((b) => '    ' + baustein(b, hilfe)).join('\n');
    await schreiben(`/aktuell/${p.kennung}/`, huelle({
      titel: p.titel, beschreibung: p.titel, pfad: '/aktuell/', inhalt, einstellungen }));
  }

  // -------------------------------------------------------------- Stellen
  for (const s of stellen) {
    const rumpf = s.markdown ? markdownZuHtml(s.rumpf) : wordpressAufraeumen(s.rumpf);
    const teile = [
      { art: 'held', spalten: 6, marke: 'Offene Stellen', markeZiel: '/jobs/', titel: s.titel,
        text: [s.pensum, s.eintritt && `Eintritt ${s.eintritt}`, 'Baar'].filter(Boolean).join(' · ') },
      { art: 'rohtext', spalten: 4, html: rumpf || '<p>Diese Ausschreibung hat noch keinen Text.</p>' },
    ];
    teile.push({ art: 'aufruf', spalten: 2, farbe: 'gelb', titel: 'Bewerbung',
      knopf: { titel: 'Jetzt bewerben',
        pfad: s.bewerbungslink || `mailto:${einstellungen.mail}?subject=${encodeURIComponent('Bewerbung ' + s.titel)}` } });
    const inhalt = teile.map((b) => '    ' + baustein(b, hilfe)).join('\n');
    await schreiben(`/jobs/${s.kennung}/`, huelle({
      titel: s.titel, beschreibung: s.titel, pfad: '/jobs/', inhalt, einstellungen }));
  }

  // -------------------------------------------------------- Beiwerk
  await cp(path.join(WURZEL, 'vorlagen/stil.css'), path.join(AUS, 'stil.css'));
  await cp(path.join(WURZEL, 'vorlagen/seite.js'), path.join(AUS, 'seite.js'));
  await cp(path.join(WURZEL, 'bilder'), path.join(AUS, 'bilder'), { recursive: true });
  if (existsSync(path.join(WURZEL, 'werkzeuge/404-seite.html'))) {
    await cp(path.join(WURZEL, 'werkzeuge/404-seite.html'), path.join(AUS, '404.html'));
  }

  const adressen = [
    ...seiten.map((s) => s.pfad),
    ...beitraege.map((p) => `/aktuell/${p.kennung}/`),
    ...stellen.map((s) => `/jobs/${s.kennung}/`),
  ];
  await writeFile(path.join(AUS, 'sitemap.txt'), adressen.join('\n') + '\n', 'utf8');
  return adressen.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`${await bauen()} Seiten nach statisch/ gebaut`);
}
