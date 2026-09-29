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
<script>
/* Vor dem ersten Zeichnen: Sonst blitzt die helle Fassung kurz auf, bevor
   das Skript am Seitenende den Dunkelmodus setzt – gerade für Menschen mit
   Lichtempfindlichkeit das Gegenteil von hilfreich. */
try {
  var z = JSON.parse(localStorage.getItem('sobe.zugang') || '{}');
  if (z.dunkel) document.documentElement.classList.add('dunkel');
  if (z.gross) document.documentElement.classList.add('grossschrift');
} catch (e) { /* Privates Fenster ohne Speicher: dann eben ohne Vorwahl. */ }
</script>
</head>
<body>
<a class="springen" href="#inhalt">Zum Inhalt springen</a>

<header class="kopf">
  <div class="kopfband">
    <a class="logo" href="/" aria-label="${schuetzen(einstellungen.name)}, zur Startseite"><img class="fuerhell" src="/bilder/logo.png" alt="${schuetzen(einstellungen.name)}"><img class="fuerdunkel" src="/bilder/logo-weiss.png" alt="" aria-hidden="true"></a>

    <div class="werkzeuge">
      <button id="zugang" class="werkzeug" aria-expanded="false" aria-controls="zugangsfeld" aria-label="Barrierefreiheit">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22">
          <circle cx="12" cy="4" r="2" fill="currentColor"/>
          <path d="M3.5 8.2c2.8.9 5.5 1.3 8.5 1.3s5.7-.4 8.5-1.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 9.5v5m0 0l-3 7m3-7l3 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div id="zugangsfeld" class="zugangsfeld" hidden>
        <p class="zugangstitel">Barrierefreiheit</p>
        <button type="button" class="schalter" data-schalter="vorlesen" aria-pressed="false">
          <span class="schaltertext"><span class="schaltername">Vorlese-Modus</span><span class="schalterhilfe">Liest den Seiteninhalt laut vor.</span></span><span class="ampel" aria-hidden="true"></span>
        </button>
        <button type="button" class="schalter" data-schalter="gross" aria-pressed="false">
          <span class="schaltertext"><span class="schaltername">Grössere Schrift</span><span class="schalterhilfe">Vergrössert alle Texte um einen Viertel.</span></span><span class="ampel" aria-hidden="true"></span>
        </button>
        <button type="button" class="schalter" data-schalter="dunkel" aria-pressed="false">
          <span class="schaltertext"><span class="schaltername">Dunkler Modus</span><span class="schalterhilfe">Heller Text auf dunklem Grund.</span></span><span class="ampel" aria-hidden="true"></span>
        </button>
        <p class="zugangsfuss">Die Einstellungen bleiben auf diesem Gerät gespeichert.</p>
      </div>
    </div>

    <button id="burger" class="burger" aria-expanded="false" aria-controls="menue" aria-label="Menü">☰</button>

    <nav id="menue" class="menue" aria-label="Hauptnavigation">
${menue}
      <form class="suchform" role="search" action="/suche/" method="get">
        <label class="nurlesen" for="suchfeld">Auf der ganzen Webseite suchen</label>
        <input id="suchfeld" class="suchfeld" type="search" name="q" placeholder="Suchen" autocomplete="off">
        <button class="suchknopf" type="submit" aria-label="Suchen">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M15.4 15.4L21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </form>
      <a class="knopf gelb nurschmal" href="${schuetzen(einstellungen.menueKnopf.pfad)}">${schuetzen(einstellungen.menueKnopf.titel)}</a>
      <a class="knopf spende" href="${schuetzen(einstellungen.spendenKnopf.pfad)}">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="17" height="17"><path d="M12 20.5C6.5 16.9 3 14 3 10.2 3 7.6 5 5.6 7.5 5.6c1.6 0 3.3.8 4.5 2.4 1.2-1.6 2.9-2.4 4.5-2.4 2.5 0 4.5 2 4.5 4.6 0 3.8-3.5 6.7-9 10.3z" fill="currentColor"/></svg>
        ${schuetzen(einstellungen.spendenKnopf.titel)}</a>
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

// Zieht den blossen Lesetext aus einem erzeugten Abschnitt. Der Suchindex
// entsteht so aus genau dem, was auch auf der Seite steht – nicht aus einer
// zweiten, still auseinanderlaufenden Quelle.
function nurText(html) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|#160);/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&(quot|#34);/g, '"').replace(/&(#39|apos);/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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
  const verzeichnis = [];   // wird am Schluss zu suche.json

  // Nur die erzeugten Teile räumen – der Bestand bleibt liegen.
  for (const eintrag of existsSync(AUS) ? await readdir(AUS) : []) {
    if (eintrag === 'wp-content') continue;
    await rm(path.join(AUS, eintrag), { recursive: true, force: true });
  }
  await mkdir(AUS, { recursive: true });

  for (const s of seiten) {
    const inhalt = s.bausteine.map((b) => '    ' + baustein(b, hilfe)).join('\n');
    await schreiben(s.pfad, huelle({ ...s, inhalt, einstellungen }));
    verzeichnis.push({ t: s.titel, p: s.pfad, a: 'Seite', x: nurText(inhalt) });
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
    verzeichnis.push({ t: p.titel, p: `/aktuell/${p.kennung}/`, a: 'Beitrag',
      d: p.datum || '', x: nurText(rumpf) });
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
    verzeichnis.push({ t: s.titel, p: `/jobs/${s.kennung}/`, a: 'Offene Stelle',
      x: nurText([s.pensum, s.eintritt, s.bereich, rumpf].filter(Boolean).join(' ')) });
  }

  // ---------------------------------------------------------------- Suche
  //
  // Die Suche läuft im Browser über ein Verzeichnis aller Seiten. Das hat
  // einen Grund: Die Webseite soll auch dann vollständig funktionieren, wenn
  // sie der Apache als blosse Dateien ausliefert – ohne laufendes Node. Eine
  // Suche auf dem Server wäre genau dann weg.
  //
  // Das Formular im Kopf ist ein echtes <form> auf diese Seite. Ohne
  // JavaScript landet man hier mit ?q=… und liest wenigstens den Hinweis,
  // statt in einem toten Feld zu tippen.
  const suchseite = `    <div class="kachel petrol s6">
      <p class="marke">Suche</p>
      <h1>Auf der ganzen Webseite suchen</h1>
      <form class="grosssuche" role="search" action="/suche/" method="get">
        <label class="nurlesen" for="grossfeld">Suchbegriff</label>
        <input id="grossfeld" name="q" type="search" placeholder="Zum Beispiel: Logopädie, Aufnahme, Sporttag" autocomplete="off" autofocus>
        <button class="knopf gelb" type="submit">Suchen</button>
      </form>
    </div>
    <div class="kachel s6">
      <p id="suchlage" class="marke" role="status" aria-live="polite">Bitte geben Sie einen Suchbegriff ein.</p>
      <div id="suchergebnis"></div>
      <noscript><p class="hinweis">Die Suche braucht JavaScript. Ohne JavaScript finden Sie die Inhalte über das Menü: Angebot, Aufnahme, Aktuell, Über uns und Jobs.</p></noscript>
    </div>`;
  await schreiben('/suche/', huelle({
    titel: 'Suche', beschreibung: 'Suche auf der Webseite des SONNENBERG',
    pfad: '/suche/', inhalt: suchseite, einstellungen }));

  await writeFile(path.join(AUS, 'suche.json'), JSON.stringify(verzeichnis), 'utf8');

  // -------------------------------------------------------- Beiwerk
  await cp(path.join(WURZEL, 'vorlagen/stil.css'), path.join(AUS, 'stil.css'));
  await cp(path.join(WURZEL, 'vorlagen/seite.js'), path.join(AUS, 'seite.js'));
  await cp(path.join(WURZEL, 'bilder'), path.join(AUS, 'bilder'), { recursive: true });
  if (existsSync(path.join(WURZEL, 'werkzeuge/404-seite.html'))) {
    await cp(path.join(WURZEL, 'werkzeuge/404-seite.html'), path.join(AUS, '404.html'));
  }

  const adressen = [
    ...seiten.map((s) => s.pfad),
    '/suche/',
    ...beitraege.map((p) => `/aktuell/${p.kennung}/`),
    ...stellen.map((s) => `/jobs/${s.kennung}/`),
  ];
  await writeFile(path.join(AUS, 'sitemap.txt'), adressen.join('\n') + '\n', 'utf8');
  return adressen.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`${await bauen()} Seiten nach statisch/ gebaut`);
}
